-- Migration: Fix task_board_members RLS policy for board owners
-- Date: 2025-12-14
-- Purpose: Ensure board owners can always view members of their boards

-- Update the SELECT policy to explicitly allow board owners
DROP POLICY IF EXISTS "task_board_members_select" ON public.task_board_members;
CREATE POLICY "task_board_members_select" ON public.task_board_members
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR user_id = auth.uid()
    OR public.is_task_board_owner(board_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_board_members.board_id
        AND tb.user_id = auth.uid()
    )
  );
