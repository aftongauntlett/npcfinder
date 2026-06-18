-- Public playlist discovery and playlist tag removal.
--
-- Public playlists should be readable by authenticated users, while private
-- playlists remain visible only to owners, explicit invitees, and admins.

CREATE OR REPLACE FUNCTION public.can_view_playlist(
  check_playlist_id uuid,
  check_user_id uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    check_user_id IS NOT NULL
    AND (
      EXISTS (
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
      )
      OR EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.user_id = check_user_id
          AND up.role IN ('admin'::public.user_role, 'super_admin'::public.user_role)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_playlist(uuid, uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_playlists_public_updated
  ON public.playlists (updated_at DESC)
  WHERE is_private = false;

ALTER TABLE public.playlists
  DROP COLUMN IF EXISTS tags;
