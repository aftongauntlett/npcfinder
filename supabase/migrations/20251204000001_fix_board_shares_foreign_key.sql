-- Migration: Fix board_shares foreign key to user_profiles
-- Created: 2025-12-04
-- Description: Adds foreign key constraint from board_shares to user_profiles table
--              to enable PostgREST joins with user data

-- Drop existing foreign keys to auth.users for shared_with_user_id
-- (We keep shared_by_user_id pointing to auth.users as that's fine for internal tracking)
ALTER TABLE board_shares
  DROP CONSTRAINT IF EXISTS board_shares_shared_with_user_id_fkey;

-- Add foreign key to user_profiles instead
-- This allows PostgREST to perform joins with user_profiles table
ALTER TABLE board_shares
  ADD CONSTRAINT board_shares_shared_with_user_id_fkey 
  FOREIGN KEY (shared_with_user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT board_shares_shared_with_user_id_fkey ON board_shares IS 
  'Foreign key to user_profiles table to enable PostgREST joins for user data';
