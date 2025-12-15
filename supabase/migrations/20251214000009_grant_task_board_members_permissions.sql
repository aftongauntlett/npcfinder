-- Migration: Grant permissions on task_board_members
-- Date: 2025-12-14
-- Purpose: Ensure authenticated users have proper grants on task_board_members table

-- Grant all necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_board_members TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.task_board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_board_members FORCE ROW LEVEL SECURITY;
