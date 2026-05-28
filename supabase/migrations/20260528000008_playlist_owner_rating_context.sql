-- Add owner tracker rating context to playlist owner-context read path.
--
-- Purpose:
-- 1) Preserve owner rating visibility in playlist context (live + snapshot fallback).
-- 2) Support compare view showing owner and viewer ratings side-by-side.

ALTER TABLE public.playlist_items
ADD COLUMN IF NOT EXISTS owner_tracker_rating_snapshot integer;

COMMENT ON COLUMN public.playlist_items.owner_tracker_rating_snapshot IS
  'Fallback snapshot of owner tracker_items.rating for historical playlist visibility when tracker row is missing.';

ALTER TABLE public.playlist_items
DROP CONSTRAINT IF EXISTS playlist_items_owner_tracker_rating_snapshot_check;

ALTER TABLE public.playlist_items
ADD CONSTRAINT playlist_items_owner_tracker_rating_snapshot_check
CHECK (
  owner_tracker_rating_snapshot IS NULL
  OR (owner_tracker_rating_snapshot >= 1 AND owner_tracker_rating_snapshot <= 10)
);

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
    COALESCE(ti.media_edited_fields, '{}'::text[]),
    ti.rating
  INTO
    NEW.owner_tracker_note_snapshot,
    NEW.owner_tracker_completed_at_snapshot,
    NEW.owner_media_overrides_snapshot,
    NEW.owner_media_edited_fields_snapshot,
    NEW.owner_tracker_rating_snapshot
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
    owner_media_edited_fields_snapshot = COALESCE(NEW.media_edited_fields, '{}'::text[]),
    owner_tracker_rating_snapshot = NEW.rating
  FROM public.playlists p
  WHERE p.id = pi.playlist_id
    AND p.owner_id = NEW.user_id
    AND pi.media_id = NEW.media_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS propagate_tracker_snapshot_to_playlist_items_trigger ON public.tracker_items;
CREATE TRIGGER propagate_tracker_snapshot_to_playlist_items_trigger
AFTER INSERT OR UPDATE OF note, completed_at, media_overrides, media_edited_fields, rating
ON public.tracker_items
FOR EACH ROW
EXECUTE FUNCTION public.propagate_tracker_snapshot_to_playlist_items();

UPDATE public.playlist_items pi
SET
  owner_tracker_rating_snapshot = ti.rating
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
  owner_tracker_rating integer,
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
    COALESCE(ti.rating, pi.owner_tracker_rating_snapshot) AS owner_tracker_rating,
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
