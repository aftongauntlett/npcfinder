-- Security hardening: editors can manage members but cannot escalate others to editor

DROP POLICY IF EXISTS "media_list_members_update" ON public.media_list_members;

CREATE POLICY "media_list_members_update" ON public.media_list_members
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_manage_media_list_members(list_id, auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.is_media_list_owner(list_id, auth.uid())
    OR (
      public.can_manage_media_list_members(list_id, auth.uid())
      AND role = 'viewer'
    )
  );
