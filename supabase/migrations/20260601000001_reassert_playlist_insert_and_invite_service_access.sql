-- Reassert critical runbook permissions for playlists and admin/service checks.
-- Context: backend security integration detected drift where playlist inserts
-- were denied for authenticated owners and service-role sanity checks against
-- invite_codes returned permission denied.

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.playlists TO authenticated;

DROP POLICY IF EXISTS "playlists_insert" ON public.playlists;
CREATE POLICY "playlists_insert" ON public.playlists
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'can_view_playlist'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.can_view_playlist(uuid, uuid) TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'can_edit_playlist'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.can_edit_playlist(uuid, uuid) TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_playlist_items_with_owner_context'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_playlist_items_with_owner_context(uuid) TO authenticated';
  END IF;
END;
$$;

GRANT SELECT ON TABLE public.invite_codes TO service_role;
