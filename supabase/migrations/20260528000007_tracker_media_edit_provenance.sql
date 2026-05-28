-- Tracker media edit provenance + playlist owner edited-metadata context.
--
-- Purpose:
-- 1) Let tracker owners keep user-scoped metadata overrides on top of API/catalog media.
-- 2) Track exactly which metadata fields differ from API source.
-- 3) Expose owner edited-state to playlist viewers through the existing constrained RPC.

ALTER TABLE public.tracker_items
ADD COLUMN IF NOT EXISTS api_media_source_snapshot jsonb,
ADD COLUMN IF NOT EXISTS media_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS media_edited_fields text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.tracker_items.api_media_source_snapshot IS
  'User-scoped baseline snapshot of editable media fields from public.media at first edit time.';

COMMENT ON COLUMN public.tracker_items.media_overrides IS
  'User-scoped metadata override object containing only values changed from api_media_source_snapshot.';

COMMENT ON COLUMN public.tracker_items.media_edited_fields IS
  'User-scoped list of metadata field names currently overridden vs api_media_source_snapshot.';

ALTER TABLE public.tracker_items
DROP CONSTRAINT IF EXISTS tracker_items_media_overrides_object_check;

ALTER TABLE public.tracker_items
ADD CONSTRAINT tracker_items_media_overrides_object_check
CHECK (jsonb_typeof(media_overrides) = 'object');

ALTER TABLE public.tracker_items
DROP CONSTRAINT IF EXISTS tracker_items_api_media_source_snapshot_object_check;

ALTER TABLE public.tracker_items
ADD CONSTRAINT tracker_items_api_media_source_snapshot_object_check
CHECK (
  api_media_source_snapshot IS NULL
  OR jsonb_typeof(api_media_source_snapshot) = 'object'
);

CREATE OR REPLACE FUNCTION public.build_tracker_media_source_snapshot(target_media_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'title', m.title,
        'subtitle', m.subtitle,
        'poster_url', m.poster_url,
        'release_date', m.release_date,
        'description', m.description,
        'year', m.year,
        'genres', m.genres,
        'authors', m.authors,
        'artist', m.artist,
        'album', m.album,
        'track_duration', m.track_duration,
        'track_count', m.track_count,
        'preview_url', m.preview_url,
        'platforms', m.platforms,
        'metacritic', m.metacritic,
        'playtime', m.playtime,
        'isbn', m.isbn,
        'page_count', m.page_count,
        'publisher', m.publisher
      )
      FROM public.media m
      WHERE m.id = target_media_id
    ),
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_tracker_media_edit_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
DECLARE
  allowed_fields constant text[] := ARRAY[
    'title',
    'subtitle',
    'poster_url',
    'release_date',
    'description',
    'year',
    'genres',
    'authors',
    'artist',
    'album',
    'track_duration',
    'track_count',
    'preview_url',
    'platforms',
    'metacritic',
    'playtime',
    'isbn',
    'page_count',
    'publisher'
  ];
  field_key text;
  override_value jsonb;
  snapshot_value jsonb;
  snapshot jsonb;
  normalized_overrides jsonb := '{}'::jsonb;
  edited_fields text[] := ARRAY[]::text[];
BEGIN
  NEW.media_overrides := COALESCE(NEW.media_overrides, '{}'::jsonb);

  IF jsonb_typeof(NEW.media_overrides) <> 'object' THEN
    RAISE EXCEPTION 'tracker_items.media_overrides must be a JSON object'
      USING ERRCODE = '22023';
  END IF;

  snapshot := COALESCE(
    NEW.api_media_source_snapshot,
    public.build_tracker_media_source_snapshot(NEW.media_id),
    '{}'::jsonb
  );

  NEW.api_media_source_snapshot := snapshot;

  FOR field_key, override_value IN
    SELECT e.key, e.value
    FROM jsonb_each(NEW.media_overrides) AS e(key, value)
    ORDER BY e.key
  LOOP
    IF field_key = ANY(allowed_fields) THEN
      snapshot_value := snapshot -> field_key;

      IF snapshot_value IS DISTINCT FROM override_value THEN
        normalized_overrides := normalized_overrides || jsonb_build_object(field_key, override_value);
        edited_fields := array_append(edited_fields, field_key);
      END IF;
    END IF;
  END LOOP;

  NEW.media_overrides := normalized_overrides;
  NEW.media_edited_fields := edited_fields;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_tracker_media_edit_state_trigger ON public.tracker_items;
CREATE TRIGGER sync_tracker_media_edit_state_trigger
BEFORE INSERT OR UPDATE OF media_id, media_overrides, api_media_source_snapshot
ON public.tracker_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_tracker_media_edit_state();

UPDATE public.tracker_items ti
SET
  api_media_source_snapshot = COALESCE(
    ti.api_media_source_snapshot,
    public.build_tracker_media_source_snapshot(ti.media_id),
    '{}'::jsonb
  ),
  media_overrides = COALESCE(ti.media_overrides, '{}'::jsonb)
WHERE ti.api_media_source_snapshot IS NULL
   OR ti.media_overrides IS NULL;

-- Force trigger normalization for all rows so edited field list stays deterministic.
UPDATE public.tracker_items ti
SET media_overrides = COALESCE(ti.media_overrides, '{}'::jsonb);

ALTER TABLE public.playlist_items
ADD COLUMN IF NOT EXISTS owner_media_overrides_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS owner_media_edited_fields_snapshot text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.playlist_items.owner_media_overrides_snapshot IS
  'Fallback snapshot of owner tracker_items.media_overrides for historical playlist visibility.';

COMMENT ON COLUMN public.playlist_items.owner_media_edited_fields_snapshot IS
  'Fallback snapshot of owner tracker_items.media_edited_fields for historical playlist visibility.';

ALTER TABLE public.playlist_items
DROP CONSTRAINT IF EXISTS playlist_items_owner_media_overrides_snapshot_object_check;

ALTER TABLE public.playlist_items
ADD CONSTRAINT playlist_items_owner_media_overrides_snapshot_object_check
CHECK (jsonb_typeof(owner_media_overrides_snapshot) = 'object');

CREATE OR REPLACE FUNCTION public.sync_playlist_item_owner_tracker_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
DECLARE
  playlist_owner_id uuid;
BEGIN
  SELECT p.owner_id
  INTO playlist_owner_id
  FROM public.playlists p
  WHERE p.id = NEW.playlist_id;

  IF playlist_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    ti.note,
    ti.completed_at,
    COALESCE(ti.media_overrides, '{}'::jsonb),
    COALESCE(ti.media_edited_fields, '{}'::text[])
  INTO
    NEW.owner_tracker_note_snapshot,
    NEW.owner_tracker_completed_at_snapshot,
    NEW.owner_media_overrides_snapshot,
    NEW.owner_media_edited_fields_snapshot
  FROM public.tracker_items ti
  WHERE ti.user_id = playlist_owner_id
    AND ti.media_id = NEW.media_id
  LIMIT 1;

  NEW.owner_media_overrides_snapshot := COALESCE(
    NEW.owner_media_overrides_snapshot,
    '{}'::jsonb
  );
  NEW.owner_media_edited_fields_snapshot := COALESCE(
    NEW.owner_media_edited_fields_snapshot,
    '{}'::text[]
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.propagate_tracker_snapshot_to_playlist_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
BEGIN
  UPDATE public.playlist_items pi
  SET
    owner_tracker_note_snapshot = NEW.note,
    owner_tracker_completed_at_snapshot = NEW.completed_at,
    owner_media_overrides_snapshot = COALESCE(NEW.media_overrides, '{}'::jsonb),
    owner_media_edited_fields_snapshot = COALESCE(NEW.media_edited_fields, '{}'::text[])
  FROM public.playlists p
  WHERE p.id = pi.playlist_id
    AND p.owner_id = NEW.user_id
    AND pi.media_id = NEW.media_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS propagate_tracker_snapshot_to_playlist_items_trigger ON public.tracker_items;
CREATE TRIGGER propagate_tracker_snapshot_to_playlist_items_trigger
AFTER INSERT OR UPDATE OF note, completed_at, media_overrides, media_edited_fields
ON public.tracker_items
FOR EACH ROW
EXECUTE FUNCTION public.propagate_tracker_snapshot_to_playlist_items();

UPDATE public.playlist_items pi
SET
  owner_media_overrides_snapshot = COALESCE(ti.media_overrides, '{}'::jsonb),
  owner_media_edited_fields_snapshot = COALESCE(ti.media_edited_fields, '{}'::text[])
FROM public.playlists p,
     public.tracker_items ti
WHERE p.id = pi.playlist_id
  AND ti.user_id = p.owner_id
  AND ti.media_id = pi.media_id;

DROP FUNCTION IF EXISTS public.get_playlist_items_with_owner_context(uuid);

CREATE FUNCTION public.get_playlist_items_with_owner_context(check_playlist_id uuid)
RETURNS TABLE (
  id uuid,
  playlist_id uuid,
  media_id uuid,
  note text,
  "position" integer,
  created_at timestamptz,
  media jsonb,
  owner_tracker_note text,
  owner_tracker_completed_at timestamptz,
  owner_media_is_edited boolean,
  owner_media_edited_fields text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
DECLARE
  requester_id uuid;
BEGIN
  requester_id := auth.uid();

  IF requester_id IS NULL OR NOT public.can_view_playlist(check_playlist_id, requester_id) THEN
    RAISE EXCEPTION 'Not authorized to view playlist %', check_playlist_id
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    pi.id,
    pi.playlist_id,
    pi.media_id,
    pi.note,
    pi.position AS "position",
    pi.created_at,
    to_jsonb(m.*)
      || COALESCE(ti.media_overrides, pi.owner_media_overrides_snapshot, '{}'::jsonb) AS media,
    COALESCE(ti.note, pi.owner_tracker_note_snapshot) AS owner_tracker_note,
    COALESCE(ti.completed_at, pi.owner_tracker_completed_at_snapshot) AS owner_tracker_completed_at,
    (
      COALESCE(
        array_length(
          COALESCE(ti.media_edited_fields, pi.owner_media_edited_fields_snapshot, '{}'::text[]),
          1
        ),
        0
      ) > 0
    ) AS owner_media_is_edited,
    COALESCE(ti.media_edited_fields, pi.owner_media_edited_fields_snapshot, '{}'::text[]) AS owner_media_edited_fields
  FROM public.playlist_items pi
  INNER JOIN public.playlists p
    ON p.id = pi.playlist_id
  INNER JOIN public.media m
    ON m.id = pi.media_id
  LEFT JOIN public.tracker_items ti
    ON ti.user_id = p.owner_id
   AND ti.media_id = pi.media_id
  WHERE pi.playlist_id = check_playlist_id
  ORDER BY pi.position ASC, pi.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_playlist_items_with_owner_context(uuid) TO authenticated;
