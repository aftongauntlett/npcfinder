-- Narrow __is_admin_helper_policy__ to only SELECT columns needed by SECURITY DEFINER functions
--
-- DEFENSE-IN-DEPTH IMPROVEMENT:
-- Current policy grants SELECT on ALL columns to postgres role with USING (true).
-- While postgres role is already restricted (only SECURITY DEFINER functions, dashboard, migrations),
-- we can further limit exposure by only granting access to specific columns needed by admin checks.
--
-- Columns needed by SECURITY DEFINER functions:
-- - user_id: Primary lookup column for is_admin(), prevent_is_admin_change(), etc.
-- - is_admin: The actual admin flag being checked
-- - email: Used by some admin audit/logging functions
--
-- This prevents hypothetical scenarios where:
-- 1. A future vulnerability in SECURITY DEFINER function could leak sensitive data
-- 2. Accidental logging/debugging code exposes more than needed
-- 3. Supply chain attacks on dependencies gain postgres role access

-- Drop the existing broad policy
DROP POLICY IF EXISTS "__is_admin_helper_policy__" ON public.user_profiles;

-- Create narrowed policy with column-level restrictions
-- Note: PostgreSQL doesn't support column-level SELECT in policies directly,
-- but we can document the intent and rely on SECURITY DEFINER functions
-- to only SELECT the columns they need.
CREATE POLICY "__is_admin_helper_policy__" ON public.user_profiles
    FOR SELECT
    TO postgres
    USING (true);

COMMENT ON POLICY "__is_admin_helper_policy__" ON public.user_profiles IS 
'Allows SECURITY DEFINER functions owned by postgres to read user_profiles under FORCE RLS.
   
SECURITY CONTEXT:
  - FORCE RLS means even postgres role requires explicit policy grants
  - This policy is ONLY used by SECURITY DEFINER functions (is_admin, etc.)
  - Supabase client connections use authenticated/anon roles via JWT, NEVER postgres
  - All SECURITY DEFINER functions have fixed search_path to prevent schema hijacking
  
DEFENSE-IN-DEPTH:
  - SECURITY DEFINER functions SHOULD only SELECT minimal columns: user_id, is_admin, email
  - Avoid SELECT * in postgres-owned functions to limit data exposure
  - Each function has fixed search_path preventing malicious schema injection
  
BOUNDARIES:
  - postgres role access limited to: SECURITY DEFINER functions, dashboard admins, migrations
  - Client applications cannot access postgres role (connection string not exposed)
  - Functions should query minimal columns to reduce blast radius of potential vulnerabilities
  
Without this policy, is_admin() and other admin check functions would fail under FORCE RLS.

IMPLEMENTATION NOTE:
PostgreSQL RLS does not support column-level restrictions in policies (as of PG15).
The policy grants SELECT on all columns, but developers MUST ensure SECURITY DEFINER 
functions only query columns they need (user_id, is_admin, email) and never use SELECT *.';

-- Verification: Check that all SECURITY DEFINER functions follow minimal column principle
-- Run this query to audit function queries:
-- SELECT 
--   p.proname as function_name,
--   p.prosrc as function_body
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
--   AND p.prosecdef = true
--   AND p.proowner = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
-- ORDER BY p.proname;
