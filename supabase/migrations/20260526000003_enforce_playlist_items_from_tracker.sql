-- Migration: enforce playlist items come from owner's tracker
-- Purpose: prevent playlist_items rows from referencing media the playlist owner
-- has not tracked yet.

CREATE OR REPLACE FUNCTION public.enforce_playlist_item_media_in_owner_tracker()
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
    RAISE EXCEPTION 'Playlist % does not exist', NEW.playlist_id
      USING ERRCODE = '23503';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tracker_items ti
    WHERE ti.user_id = playlist_owner_id
      AND ti.media_id = NEW.media_id
  ) THEN
    RAISE EXCEPTION 'Playlist items must reference media already tracked by the playlist owner'
      USING ERRCODE = '23514',
            DETAIL = format(
              'playlist_id=%s media_id=%s owner_id=%s',
              NEW.playlist_id,
              NEW.media_id,
              playlist_owner_id
            ),
            HINT = 'Add the media to tracker before adding it to a playlist.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_playlist_items_from_tracker_trigger ON public.playlist_items;

CREATE TRIGGER enforce_playlist_items_from_tracker_trigger
BEFORE INSERT OR UPDATE OF playlist_id, media_id ON public.playlist_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_playlist_item_media_in_owner_tracker();

COMMENT ON FUNCTION public.enforce_playlist_item_media_in_owner_tracker IS
  'Ensures playlist_items.media_id exists in tracker_items for the playlist owner.';

COMMENT ON TRIGGER enforce_playlist_items_from_tracker_trigger ON public.playlist_items IS
  'Prevents adding playlist items that are not already in the playlist owner tracker.';
