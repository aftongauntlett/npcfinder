-- Migration: Simplify task_boards_insert policy
-- Date: 2025-12-14
-- Purpose: Remove role check complexity and just verify ownership for regular users

DROP POLICY IF EXISTS "task_boards_insert" ON public.task_boards;

CREATE POLICY "task_boards_insert" ON public.task_boards
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );
