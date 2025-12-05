-- Migration: Restrict board_shares UPDATE to Board Owners Only
-- Created: 2025-12-04
-- Description: Fixes RLS policy "Board owners and editors can update shares" to only allow
--              board owners to update share rows. Previously, the policy allowed share recipients
--              with can_edit = true to update rows without verifying they are the active editor
--              for that board, which over-grants mutation rights.
--
--              Only board owners should be able to modify sharing permissions (can_edit).
--              Share recipients (even editors) should not be able to modify share entries.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Board owners and editors can update shares" ON board_shares;

-- Create new restrictive policy: only board owners can update shares
CREATE POLICY "Board owners can update shares"
  ON board_shares
  FOR UPDATE
  USING (
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );

-- Verify RLS policies are now correctly scoped:
--   1. "Users can view board shares" - users can see shares they're involved in ✓
--   2. "Board owners can create shares" - only owners can share their boards ✓
--   3. "Board owners can update shares" - only owners can modify share permissions ✓
--   4. "Board owners can delete shares" - only owners can revoke shares ✓
