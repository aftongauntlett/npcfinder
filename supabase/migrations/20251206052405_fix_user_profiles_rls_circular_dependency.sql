-- Migration: Fix User Profiles RLS Circular Dependency
-- Issue: The is_admin() function reads from user_profiles, but if user_profiles
--        SELECT policy calls is_admin(), it creates a circular dependency
-- Solution: Ensure user_profiles SELECT policy does NOT call is_admin()
--          It should allow all authenticated users to read all profiles

-- =============================================================================
-- FIX: USER_PROFILES SELECT POLICY
-- =============================================================================

-- The existing policy "Anyone can view profiles" should already work, but let's ensure
-- it's not been overridden or has issues

-- First, check if there are any restrictive SELECT policies and drop them
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile OR admins can view all" ON user_profiles;

-- Ensure the correct policy exists: all authenticated users can view all profiles
-- This is safe because profile data is meant to be visible to other users in the app
-- CRITICAL: This policy MUST NOT call is_admin() or any function that reads user_profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;

CREATE POLICY "Anyone can view profiles" ON user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Keep the UPDATE policy that allows users to update their own profile
-- OR admins to update any profile (this is fine because SELECT works first)
-- No changes needed to UPDATE/DELETE policies

-- =============================================================================
-- VERIFICATION
-- =============================================================================

COMMENT ON POLICY "Anyone can view profiles" ON user_profiles IS 
  'CRITICAL: Must use USING (true) with NO is_admin() call to avoid circular dependency. All authenticated users can view all profiles.';
