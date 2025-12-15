-- Migration: Simplify task_board_members RLS policy
-- Date: 2025-12-14
-- Purpose: Remove redundant conditions and ensure board owners can view members

-- The issue is that is_task_board_owner might not be evaluating correctly in all contexts
-- Let's use a simpler, inline check that definitely works
DROP POLICY IF EXISTS "task_board_members_select" ON public.task_board_members;
CREATE POLICY "task_board_members_select" ON public.task_board_members
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_board_members.board_id
        AND tb.user_id = auth.uid()
    )
  );
