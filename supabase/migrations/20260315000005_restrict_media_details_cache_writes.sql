-- Security hardening: restrict cache write access to admins

DROP POLICY IF EXISTS "media_details_cache_insert" ON public.media_details_cache;
DROP POLICY IF EXISTS "media_details_cache_update" ON public.media_details_cache;

CREATE POLICY "admins_can_write_cache" ON public.media_details_cache
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_update_cache" ON public.media_details_cache
  FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));
