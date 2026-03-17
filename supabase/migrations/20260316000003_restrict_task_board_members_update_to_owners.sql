-- Security hardening: only board owners/admins can update task_board_members roles

DROP POLICY IF EXISTS "task_board_members_update" ON public.task_board_members;

CREATE POLICY "task_board_members_update" ON public.task_board_members
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.is_task_board_owner(board_id, auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.is_task_board_owner(board_id, auth.uid())
  );
