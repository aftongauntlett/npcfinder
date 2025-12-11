-- Migration: Fix missing INSERT policy for task_boards
-- Date: 2024-12-10
-- Purpose: Add the missing INSERT policy that was dropped in 20251207000006_update_rls_for_roles.sql

-- Drop any existing INSERT policy first (in case there's a partial one)
DROP POLICY IF EXISTS "Users can create their own boards" ON task_boards;
DROP POLICY IF EXISTS "users_insert_own_boards" ON task_boards;

-- Create INSERT policy: Users can create boards for themselves
CREATE POLICY "users_insert_own_boards" ON task_boards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "users_insert_own_boards" ON task_boards IS 'Allow authenticated users to create boards for themselves';
