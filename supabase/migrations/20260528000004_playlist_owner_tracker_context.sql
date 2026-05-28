-- Playlist owner tracker context + public visibility support.
--
-- This migration implements the foundational read path for playlist viewers to see
-- owner tracker note/completed_at in a constrained, playlist-scoped context.
--
-- Privacy boundary:
-- - tracker_items remains private under existing RLS.
-- - owner tracker fields are exposed only through get_playlist_items_with_owner_context,
--   which checks can_view_playlist for the requested playlist.

ALTER TABLE public.playlist_items
ADD COLUMN IF NOT EXISTS owner_tracker_note_snapshot text,
ADD COLUMN IF NOT EXISTS owner_tracker_completed_at_snapshot timestamptz;

COMMENT ON COLUMN public.playlist_items.owner_tracker_note_snapshot IS
  'Fallback snapshot of owner tracker_items.note for historical playlist visibility when tracker row is missing.';

COMMENT ON COLUMN public.playlist_items.owner_tracker_completed_at_snapshot IS
  'Fallback snapshot of owner tracker_items.completed_at for historical playlist visibility when tracker row is missing.';

-- Support explicit shares and public playlists.
CREATE OR REPLACE FUNCTION public.can_view_playlist(check_playlist_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.id = check_playlist_id
        AND p.owner_id = check_user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.id = check_playlist_id
        AND p.is_private = false
    )
    OR EXISTS (
      SELECT 1
      FROM public.playlist_shares ps
      WHERE ps.playlist_id = check_playlist_id
        AND ps.shared_with_user_id = check_user_id
    );
$$;

-- Keep snapshots in sync whenever playlist items are created or media is changed.
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

  SELECT ti.note, ti.completed_at
  INTO NEW.owner_tracker_note_snapshot, NEW.owner_tracker_completed_at_snapshot
  FROM public.tracker_items ti
  WHERE ti.user_id = playlist_owner_id
    AND ti.media_id = NEW.media_id
  LIMIT 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_playlist_item_owner_tracker_snapshot_trigger ON public.playlist_items;
CREATE TRIGGER sync_playlist_item_owner_tracker_snapshot_trigger
BEFORE INSERT OR UPDATE OF playlist_id, media_id
ON public.playlist_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_playlist_item_owner_tracker_snapshot();

-- Keep snapshots updated as owner tracker note/date changes over time.
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
    owner_tracker_completed_at_snapshot = NEW.completed_at
  FROM public.playlists p
  WHERE p.id = pi.playlist_id
    AND p.owner_id = NEW.user_id
    AND pi.media_id = NEW.media_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS propagate_tracker_snapshot_to_playlist_items_trigger ON public.tracker_items;
CREATE TRIGGER propagate_tracker_snapshot_to_playlist_items_trigger
AFTER INSERT OR UPDATE OF note, completed_at
ON public.tracker_items
FOR EACH ROW
EXECUTE FUNCTION public.propagate_tracker_snapshot_to_playlist_items();

-- Backfill snapshots for existing playlist items from live owner tracker rows.
UPDATE public.playlist_items pi
SET
  owner_tracker_note_snapshot = ti.note,
  owner_tracker_completed_at_snapshot = ti.completed_at
FROM public.playlists p,
     public.tracker_items ti
WHERE p.id = pi.playlist_id
  AND ti.user_id = p.owner_id
  AND ti.media_id = pi.media_id;

CREATE OR REPLACE FUNCTION public.get_playlist_items_with_owner_context(check_playlist_id uuid)
RETURNS TABLE (
  id uuid,
  playlist_id uuid,
  media_id uuid,
  note text,
  "position" integer,
  created_at timestamptz,
  media jsonb,
  owner_tracker_note text,
  owner_tracker_completed_at timestamptz
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
    to_jsonb(m.*) AS media,
    COALESCE(ti.note, pi.owner_tracker_note_snapshot) AS owner_tracker_note,
    COALESCE(ti.completed_at, pi.owner_tracker_completed_at_snapshot) AS owner_tracker_completed_at
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
