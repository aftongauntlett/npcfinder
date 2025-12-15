-- Migration: Fix task_boards_insert policy to handle NULL roles
-- Date: 2025-12-14
-- Purpose: Allow users without a user_profiles entry to create boards

DROP POLICY IF EXISTS "task_boards_insert" ON public.task_boards;

CREATE POLICY "task_boards_insert" ON public.task_boards
  FOR INSERT TO authenticated
  WITH CHECK (
    COALESCE(public.get_user_role(auth.uid()), 'user'::user_role) IN ('admin', 'super_admin')
    OR auth.uid() = user_id
  );
