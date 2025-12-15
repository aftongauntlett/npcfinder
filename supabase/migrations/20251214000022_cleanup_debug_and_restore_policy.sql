-- Migration: Cleanup debug artifacts and restore proper INSERT policy
-- Date: 2025-12-14
-- Purpose: Remove debug logging and restore admin check in INSERT policy

-- Remove debug trigger and function
DROP TRIGGER IF EXISTS log_task_board_insert_trigger ON task_boards;
DROP FUNCTION IF EXISTS public.log_task_board_insert_check();

-- Remove debug table
DROP TABLE IF EXISTS public.auth_debug_log;

-- Restore INSERT policy with admin check
-- (Currently it only checks ownership, but admins should also be able to insert)
DROP POLICY IF EXISTS "task_boards_insert" ON public.task_boards;

CREATE POLICY "task_boards_insert" ON public.task_boards
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

COMMENT ON POLICY "task_boards_insert" ON public.task_boards IS 
  'Users can insert boards they own, or admins can insert any board';
