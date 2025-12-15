-- Migration: Use SECURITY DEFINER function for task_board_members RLS
-- Date: 2025-12-14
-- Purpose: Bypass RLS issues by using a function that has row_security OFF

-- Create a dedicated function to check if user can see board members
CREATE OR REPLACE FUNCTION public.can_view_board_members(check_board_id uuid, check_user_id uuid, check_member_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security TO 'off'
AS $$
  SELECT
    -- Admins can see all
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    -- Users can see themselves as members
    OR check_member_user_id = check_user_id
    -- Board owners can see all members of their boards
    OR EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = check_board_id
        AND tb.user_id = check_user_id
    );
$$;

-- Update the SELECT policy to use the new function
DROP POLICY IF EXISTS "task_board_members_select" ON public.task_board_members;
CREATE POLICY "task_board_members_select" ON public.task_board_members
  FOR SELECT TO authenticated
  USING (
    public.can_view_board_members(board_id, auth.uid(), user_id)
  );
