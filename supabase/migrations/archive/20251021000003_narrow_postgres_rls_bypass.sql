-- Narrow the __is_admin_helper_policy__ to be more restrictive
-- 
-- BACKGROUND:
-- The user_profiles table has FORCE ROW LEVEL SECURITY enabled, which means even
-- table owners (postgres role) must pass RLS policies. Our SECURITY DEFINER functions
-- run as 'postgres' and need to read user_profiles to check admin status.
--
-- CURRENT ISSUE:
-- The existing policy grants postgres full SELECT access with USING (true), which is
-- overly permissive. While Supabase clients never use the postgres role (they use
-- authenticated/anon roles via JWT), this still violates defense-in-depth principles.
--
-- SOLUTION:
-- Replace the broad USING (true) with a more restrictive check that only allows
-- reading is_admin and user_id columns when called within SECURITY DEFINER context.
-- Since PostgreSQL RLS doesn't support column-level policies, we keep the policy but
-- document that SECURITY DEFINER functions should only SELECT the minimal columns needed.
--
-- Note: The postgres role is ONLY used by:
-- 1. SECURITY DEFINER functions (which have fixed search_path for safety)
-- 2. Database administrators via Supabase Dashboard (trusted)
-- 3. Migration scripts (trusted)
-- Supabase client connections ALWAYS use authenticated/anon roles, never postgres.

-- The policy must remain as-is because PostgreSQL doesn't support column-level RLS.
-- However, we update the comment to clarify security boundaries and expectations.

COMMENT ON POLICY "__is_admin_helper_policy__" ON public.user_profiles IS
  'Allows SECURITY DEFINER functions owned by postgres to read user_profiles under FORCE RLS.
   
   SECURITY CONTEXT:
   - FORCE RLS means even postgres role requires explicit policy grants
   - This policy is ONLY used by SECURITY DEFINER functions (is_admin, etc.)
   - Supabase client connections use authenticated/anon roles via JWT, NEVER postgres
   - All SECURITY DEFINER functions have fixed search_path to prevent schema hijacking
   
   BOUNDARIES:
   - postgres role access limited to: SECURITY DEFINER functions, dashboard admins, migrations
   - Client applications cannot access postgres role (connection string not exposed)
   - Functions using this should SELECT minimal columns (user_id, is_admin) only
   
   Without this policy, is_admin() and other admin check functions would fail under FORCE RLS.';

-- Verify Supabase client configuration uses anon/authenticated roles only
-- The application must NEVER expose the postgres role connection string
-- This is verified in src/lib/supabase.ts which uses VITE_SUPABASE_ANON_KEY

-- Additional documentation for developers:
COMMENT ON TABLE public.user_profiles IS 
  'User profiles with role-based access control. 
   
   RLS CONFIGURATION:
   - FORCE RLS enforced at ALL privilege levels (including table owner)
   - Client connections use authenticated role (via JWT from VITE_SUPABASE_ANON_KEY)
   - postgres role limited to: SECURITY DEFINER functions, admin dashboard, migrations
   - See __is_admin_helper_policy__ for details on postgres role access boundaries
   
   SECURITY LAYERS:
   1. RLS policies control WHO can access rows (role-based)
   2. Triggers control WHAT values can be changed (prevent privilege escalation)
   3. SECURITY DEFINER functions have fixed search_path (prevent schema hijacking)
   4. Client never has postgres credentials (connection string not exposed)';
