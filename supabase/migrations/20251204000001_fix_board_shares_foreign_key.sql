-- Migration: Fix board_shares.shared_with_user_id Foreign Key
-- Created: 2025-12-04
-- Description: Corrects the foreign key for board_shares.shared_with_user_id to reference
--              auth.users(id) instead of user_profiles(user_id) for proper type alignment.
--              This ensures consistency with how shared_with_user_id is used in RLS policies
--              and application code (compared against auth.uid()).

-- Drop the incorrect foreign key constraint
ALTER TABLE board_shares
  DROP CONSTRAINT IF EXISTS board_shares_shared_with_user_id_fkey;

-- Add the correct foreign key pointing to auth.users(id)
ALTER TABLE board_shares
  ADD CONSTRAINT board_shares_shared_with_user_id_fkey
  FOREIGN KEY (shared_with_user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Verify RLS policies still work correctly (they compare shared_with_user_id to auth.uid())
-- All existing RLS policies in 20251204000000_add_tasks_enhancements.sql are correct:
--   1. "Users can view board shares" - uses shared_with_user_id = auth.uid() ✓
--   2. "Board owners can create shares" - doesn't touch shared_with_user_id ✓
--   3. "Board owners and editors can update shares" - uses shared_with_user_id = auth.uid() ✓
--   4. "Board owners can delete shares" - doesn't touch shared_with_user_id ✓
--
-- Application code in src/services/tasksService.ts correctly:
--   - Inserts auth user IDs into shared_with_user_id
--   - Queries with shared_with_user_id = user.id (from auth.getUser())
--   - Joins to user_profiles via the correct foreign key relationship for display data
