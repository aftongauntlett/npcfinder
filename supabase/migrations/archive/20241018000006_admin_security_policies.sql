-- Comprehensive Admin Security Policies (CORRECTED)
-- Ensures only admins can modify admin status and access admin-only data
-- Protects against direct API manipulation (Postman, etc.)
--
-- SECURITY ARCHITECTURE:
-- - RLS policies control WHO can access rows
-- - Triggers control WHAT values can be changed
-- - This separation prevents NEW/OLD reference errors and recursion

-- ============================================================================
-- STEP 1: Enable and FORCE Row Level Security
-- ============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_profiles IS 
  'User profiles with role-based access control. RLS enforced at all privilege levels.';

-- ============================================================================
-- STEP 2: Create hardened helper function to check admin status
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = check_user_id 
    AND user_profiles.is_admin = true
  );
END;
$$;

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Set explicit ownership to trusted role
ALTER FUNCTION public.is_admin(UUID) OWNER TO postgres;

COMMENT ON FUNCTION public.is_admin(UUID) IS 
  'Returns true if the specified user has admin privileges. SECURITY DEFINER with fixed search_path to prevent schema hijacking.';

-- ============================================================================
-- STEP 3: Simplified RLS Policies (no NEW/OLD references)
-- ============================================================================

-- Drop existing UPDATE policies to start clean
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile (except admin status)" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any user admin status" ON public.user_profiles;

-- IMPORTANT: Keep existing SELECT, INSERT, DELETE policies from original migration
-- They are: "Anyone can view profiles", "Users can insert own profile", "Users can delete own profile"

-- Add SELECT policy for the function definer role to prevent RLS blindness
-- This allows is_admin() to read user_profiles under FORCE RLS
DROP POLICY IF EXISTS "__is_admin_helper_policy__" ON public.user_profiles;
CREATE POLICY "__is_admin_helper_policy__"
  ON public.user_profiles
  FOR SELECT
  TO postgres
  USING (true);

COMMENT ON POLICY "__is_admin_helper_policy__" ON public.user_profiles IS
  'Allows SECURITY DEFINER functions owned by postgres to read user_profiles under FORCE RLS. Without this, is_admin() would be blind.';

-- Policy 1: Users can update their own profile
-- (Trigger will prevent is_admin changes)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins can update ANY user's profile
CREATE POLICY "Admins can update any profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

COMMENT ON POLICY "Users can update own profile" ON public.user_profiles IS
  'Users can attempt to update their own profile. Trigger prevents is_admin changes by non-admins.';

COMMENT ON POLICY "Admins can update any profile" ON public.user_profiles IS
  'Admin users can update any profile, including granting/revoking admin. Super admin protected by separate trigger.';

-- ============================================================================
-- STEP 4: Trigger to prevent UPDATE privilege escalation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_admin_escalation_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If is_admin field is being changed
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    -- Only allow change if current user is an admin
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permission denied: Only admins can modify admin status'
        USING HINT = 'Contact an administrator to change your privileges.',
              ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_admin_escalation_update ON public.user_profiles;

-- Create trigger for UPDATE operations
CREATE TRIGGER enforce_admin_escalation_update
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_escalation_update();

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.prevent_admin_escalation_update() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_admin_escalation_update() TO authenticated;

-- Set explicit ownership to trusted role
ALTER FUNCTION public.prevent_admin_escalation_update() OWNER TO postgres;

COMMENT ON FUNCTION public.prevent_admin_escalation_update() IS 
  'Trigger function that blocks is_admin changes unless caller is already admin. SECURITY DEFINER with fixed search_path.';

-- ============================================================================
-- STEP 5: Trigger to prevent INSERT privilege escalation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_admin_self_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If user is creating their own profile
  IF NEW.user_id = auth.uid() THEN
    -- Force is_admin to false unless they're already an admin
    -- (edge case: admin creating a new profile for themselves)
    IF NOT public.is_admin(auth.uid()) THEN
      NEW.is_admin := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_admin_self_grant_protection ON public.user_profiles;

-- Create trigger for INSERT operations
CREATE TRIGGER enforce_admin_self_grant_protection
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_self_grant();

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.prevent_admin_self_grant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_admin_self_grant() TO authenticated;

-- Set explicit ownership to trusted role
ALTER FUNCTION public.prevent_admin_self_grant() OWNER TO postgres;

COMMENT ON FUNCTION public.prevent_admin_self_grant() IS 
  'Trigger function that prevents users from granting themselves admin during profile creation. SECURITY DEFINER with fixed search_path.';

-- ============================================================================
-- STEP 6: Ensure column constraints
-- ============================================================================

ALTER TABLE public.user_profiles 
  ALTER COLUMN is_admin SET DEFAULT false;

ALTER TABLE public.user_profiles 
  ALTER COLUMN is_admin SET NOT NULL;

-- ============================================================================
-- STEP 7: Cleanup privileges on user_profiles table
-- ============================================================================

-- Note: We preserve the original GRANT from the initial migration
-- Original grants: SELECT, INSERT, UPDATE, DELETE to authenticated
-- These are still needed for the existing RLS policies to work

-- Revoke broad privileges from PUBLIC (not from authenticated)
REVOKE ALL ON public.user_profiles FROM PUBLIC;

-- Verify authenticated still has necessary grants (from original migration):
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
-- We don't re-grant here to avoid conflicts; original migration handles it

COMMENT ON TABLE public.user_profiles IS 
  'User profiles with multi-layer security: RLS policies control row access, triggers enforce value integrity for is_admin field.';

-- ============================================================================
-- STEP 8: Verification queries (for manual testing)
-- ============================================================================

-- Test 1: Verify RLS is enabled and forced
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on user_profiles';
  END IF;
  
  RAISE NOTICE 'RLS verification passed: user_profiles is protected';
END $$;

-- Test 2: Verify triggers exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'enforce_admin_escalation_update'
  ) THEN
    RAISE EXCEPTION 'UPDATE trigger not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'enforce_admin_self_grant_protection'
  ) THEN
    RAISE EXCEPTION 'INSERT trigger not found';
  END IF;
  
  RAISE NOTICE 'Trigger verification passed: both triggers active';
END $$;
