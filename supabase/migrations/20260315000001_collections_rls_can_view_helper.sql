-- Migration: Collections RLS policy helper adoption
-- Date: 2026-03-15
--
-- Supersedes the original friend-connection visibility model from
-- 20251213000001_media_lists.sql by delegating read visibility to
-- public.can_view_media_list(list_id, auth.uid()).

DROP POLICY IF EXISTS "media_lists_select" ON public.media_lists;
CREATE POLICY "media_lists_select" ON public.media_lists
  FOR SELECT TO authenticated
  USING (public.can_view_media_list(id, auth.uid()));

DROP POLICY IF EXISTS "media_list_items_select" ON public.media_list_items;
CREATE POLICY "media_list_items_select" ON public.media_list_items
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_view_media_list(list_id, auth.uid())
  );
