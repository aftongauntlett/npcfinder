-- Migration: Document User Profiles RLS Design
-- Description: Documents that user_profiles SELECT policy must remain open to avoid circular dependencies
-- Date: 2025-12-07
-- Issue: Comment 8 - RLS fix migration needs explicit documentation to prevent future drift

-- Add explicit documentation to the user_profiles SELECT policy
-- This policy was corrected in 20251206052405_fix_user_profiles_rls_circular_dependency.sql
COMMENT ON POLICY "Anyone can view profiles" ON user_profiles IS 
'CRITICAL DESIGN CONSTRAINT: This policy MUST use USING (true) with NO calls to is_admin() or get_user_role().

WHY: The is_admin() and get_user_role() functions read from user_profiles. If this SELECT policy 
calls those functions, it creates a circular dependency that causes query failures.

SECURITY: Allowing all authenticated users to view all profiles is intentional and safe:
- Profile data is meant to be visible to other users in the app (for connections, recommendations, etc.)
- UPDATE and DELETE policies still enforce proper access control
- The role column and is_admin generated column are protected by separate triggers

DO NOT change this policy to add role checks without understanding the circular dependency issue.
If you need to restrict profile visibility, use a different approach that does not call functions 
that read from user_profiles.';

-- Add comment to the table itself documenting the RLS design
COMMENT ON TABLE user_profiles IS
'User profile information with role-based access control.

RLS DESIGN NOTES:
- SELECT policy allows all authenticated users (USING true) to avoid circular dependencies
- UPDATE policy enforces users can only update their own profile (with admin override)
- Role changes are protected by triggers (prevent_super_admin_revoke, prevent_admin_escalation)
- The is_admin column is a GENERATED column derived from the role column

CIRCULAR DEPENDENCY WARNING:
The SELECT policy on this table must NOT call is_admin() or get_user_role() functions,
as those functions read from this table. See policy comments for details.';
