-- Ensure playlist permissions work for all authenticated users (not only elevated roles).
-- This hardens helper functions used by playlist RLS and reasserts insert grants/policies.

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

CREATE OR REPLACE FUNCTION public.can_edit_playlist(
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
        FROM public.user_profiles up
        WHERE up.user_id = check_user_id
          AND up.role IN ('admin'::public.user_role, 'super_admin'::public.user_role)
      )
    );
$$;

DROP POLICY IF EXISTS "playlists_insert" ON public.playlists;
CREATE POLICY "playlists_insert" ON public.playlists
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

GRANT EXECUTE ON FUNCTION public.can_view_playlist(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_playlist(uuid, uuid) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
