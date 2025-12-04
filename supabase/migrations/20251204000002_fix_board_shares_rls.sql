-- Migration: Fix board_shares RLS policies for viewing
-- Created: 2025-12-04
-- Description: Updates RLS policies to allow viewing board shares when querying boards
--              Users need to see share information for boards they can access

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view shares for their boards or boards shared with them" ON board_shares;
DROP POLICY IF EXISTS "Users can view board shares" ON board_shares;

-- Create a simpler SELECT policy without circular references
-- Allow users to view shares for boards they own or shares where they're involved
CREATE POLICY "Users can view board shares"
  ON board_shares
  FOR SELECT
  USING (
    -- Board owner can see all shares for their boards
    EXISTS (
      SELECT 1 FROM task_boards 
      WHERE task_boards.id = board_shares.board_id 
      AND task_boards.user_id = auth.uid()
    )
    OR
    -- Users can see shares where they're the recipient
    shared_with_user_id = auth.uid()
    OR
    -- Users who created the share can see it
    shared_by_user_id = auth.uid()
  );

COMMENT ON POLICY "Users can view board shares" ON board_shares IS 
  'Allows users to view share information for boards they own or shares where they are the sharer/recipient';
