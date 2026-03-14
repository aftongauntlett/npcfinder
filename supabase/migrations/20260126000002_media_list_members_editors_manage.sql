-- Migration: Allow editors to manage media list members
-- Aligns membership management with item editing permissions (owner + editor).

-- SECURITY DEFINER helper bypasses RLS to avoid recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.can_manage_media_list_members(check_list_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR public.is_media_list_owner(check_list_id, check_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.media_list_members m
      WHERE m.list_id = check_list_id
        AND m.user_id = check_user_id
        AND m.role = 'editor'
    );
$$;

-- MEDIA_LIST_MEMBERS
DROP POLICY IF EXISTS "media_list_members_select" ON public.media_list_members;
CREATE POLICY "media_list_members_select" ON public.media_list_members
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR user_id = auth.uid()
    OR public.can_manage_media_list_members(list_id, auth.uid())
  );

DROP POLICY IF EXISTS "media_list_members_insert" ON public.media_list_members;
CREATE POLICY "media_list_members_insert" ON public.media_list_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (
      invited_by = auth.uid()
      AND public.can_manage_media_list_members(list_id, auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.connections c
        WHERE (c.user_id = auth.uid() AND c.friend_id = media_list_members.user_id)
           OR (c.friend_id = auth.uid() AND c.user_id = media_list_members.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "media_list_members_update" ON public.media_list_members;
CREATE POLICY "media_list_members_update" ON public.media_list_members
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_manage_media_list_members(list_id, auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_manage_media_list_members(list_id, auth.uid())
  );

DROP POLICY IF EXISTS "media_list_members_delete" ON public.media_list_members;
CREATE POLICY "media_list_members_delete" ON public.media_list_members
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_manage_media_list_members(list_id, auth.uid())
  );
