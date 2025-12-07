-- Migration: Fix Rate Limits RLS Policy to Use Correct Column
-- Description: Replaces incorrect 'identifier' column reference with correct 'key' column
-- Date: 2025-12-07
-- Issue: Comment 2 - Rate limit policies reference non-existent identifier column

-- Drop the incorrect policy that references 'identifier'
DROP POLICY IF EXISTS "users_view_own_or_admins_view_all" ON rate_limits;

-- Recreate the policy using the correct 'key' column
-- This matches the semantics from 20251207000001_add_rate_limiting.sql
-- but adds admin override using get_user_role()
CREATE POLICY "users_view_own_or_admins_view_all" ON rate_limits
  FOR SELECT TO authenticated
  USING (
    -- Users can view their own rate limits based on email patterns in the key
    key LIKE 'signin:%' || COALESCE(auth.email(), '') || '%' 
    OR key LIKE 'signup:%' || COALESCE(auth.email(), '') || '%'
    OR key LIKE 'invite:%' || COALESCE(auth.email(), '') || '%'
    -- Admins and super admins can view all rate limits
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Add comment explaining the policy logic
COMMENT ON POLICY "users_view_own_or_admins_view_all" ON rate_limits IS
'Allows users to view their own rate limit records (matched by email patterns in the key column) 
and allows admins/super admins to view all rate limit records.';
