-- Migration: Fix user_watchlist RLS and remove duplicate policies
-- Issue: RLS was disabled and old baseline policies were not properly cleaned up
-- This migration:
--   1. Re-enables RLS on user_watchlist
--   2. Removes old baseline policies (duplicates)
--   3. Keeps the new role-based policies

-- Re-enable RLS (this is the main fix for the Security Advisor warning)
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Drop old baseline policies (these are duplicates of the new role-based ones)
DROP POLICY IF EXISTS "Users can add to own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can view own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can update own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can delete from own watchlist" ON user_watchlist;

-- The new role-based policies remain:
-- - users_insert_own_or_admin_all
-- - users_select_own_or_admin_all
-- - users_update_own_or_admin_all
-- - users_delete_own_or_admin_all

COMMENT ON TABLE user_watchlist IS 'Personal watchlist for movies and TV shows. RLS enabled with role-based policies.';
