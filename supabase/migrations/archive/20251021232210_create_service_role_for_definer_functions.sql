-- Create dedicated role for SECURITY DEFINER functions to narrow privilege surface
--
-- SECURITY IMPROVEMENT:
-- Currently all SECURITY DEFINER functions are owned by 'postgres' superuser role.
-- While application traffic uses 'authenticated'/'anon' roles (never postgres),
-- using postgres for function ownership is overly broad for defense-in-depth.
--
-- SOLUTION:
-- 1. Create 'npc_service_role' with minimal privileges (no superuser, no login)
-- 2. Grant only what's needed: SELECT on user_profiles, INSERT on connections, etc.
-- 3. Transfer function ownership from postgres to npc_service_role
-- 4. Update __is_admin_helper_policy__ to grant SELECT to npc_service_role instead of postgres
--
-- This ensures that even if a vulnerability exists in a SECURITY DEFINER function,
-- the blast radius is limited to what npc_service_role can access (not full postgres privileges).

-- Step 1: Create dedicated service role (no login, not superuser)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'npc_service_role') THEN
        CREATE ROLE npc_service_role NOLOGIN;
    END IF;
END
$$;

-- Allow postgres to grant this role (needed for function ownership transfer)
GRANT npc_service_role TO postgres;

-- Step 2: Grant minimal necessary privileges to service role
-- Allow access to schemas needed by functions
GRANT USAGE ON SCHEMA public TO npc_service_role;
GRANT USAGE ON SCHEMA auth TO npc_service_role;

-- Grant CREATE on public schema (required for function ownership)
-- This is revoked after ownership transfer for defense-in-depth
GRANT CREATE ON SCHEMA public TO npc_service_role;

-- Grant table-level permissions (minimal surface)
-- user_profiles: Need SELECT for admin checks, UPDATE for email sync
GRANT SELECT, UPDATE ON public.user_profiles TO npc_service_role;

-- invite_codes: Need SELECT, UPDATE for validation and consumption
GRANT SELECT, UPDATE ON public.invite_codes TO npc_service_role;

-- connections: Need INSERT for bidirectional connection creation
GRANT INSERT ON public.connections TO npc_service_role;

-- invite_code_audit_log: Need INSERT for audit trail
GRANT INSERT ON public.invite_code_audit_log TO npc_service_role;

-- auth.users: Need SELECT for email sync trigger (read-only on auth schema)
GRANT SELECT ON auth.users TO npc_service_role;

-- Step 3: Transfer function ownership from postgres to npc_service_role
ALTER FUNCTION public.batch_connect_users(uuid[]) OWNER TO npc_service_role;
ALTER FUNCTION public.consume_invite_code(text, uuid) OWNER TO npc_service_role;
ALTER FUNCTION public.create_bidirectional_connection(uuid, uuid) OWNER TO npc_service_role;
ALTER FUNCTION public.handle_new_user() OWNER TO npc_service_role;
ALTER FUNCTION public.is_admin(uuid) OWNER TO npc_service_role;
ALTER FUNCTION public.prevent_admin_escalation_update() OWNER TO npc_service_role;
ALTER FUNCTION public.prevent_admin_self_grant() OWNER TO npc_service_role;
ALTER FUNCTION public.prevent_is_admin_change() OWNER TO npc_service_role;
ALTER FUNCTION public.prevent_super_admin_revoke() OWNER TO npc_service_role;
ALTER FUNCTION public.sync_user_email_on_update() OWNER TO npc_service_role;
ALTER FUNCTION public.validate_invite_code(text) OWNER TO npc_service_role;
ALTER FUNCTION public.validate_invite_code(text, text) OWNER TO npc_service_role;

-- Revoke CREATE privilege after ownership transfer (defense-in-depth)
REVOKE CREATE ON SCHEMA public FROM npc_service_role;

-- Step 4: Update RLS policy to grant access to service role instead of postgres
DROP POLICY IF EXISTS "__is_admin_helper_policy__" ON public.user_profiles;

CREATE POLICY "__is_admin_helper_policy__" ON public.user_profiles
    FOR SELECT
    TO npc_service_role
    USING (true);

COMMENT ON POLICY "__is_admin_helper_policy__" ON public.user_profiles IS 
'Allows SECURITY DEFINER functions owned by npc_service_role to read user_profiles under FORCE RLS.
   
SECURITY CONTEXT:
  - FORCE RLS means even privileged roles require explicit policy grants
  - This policy grants access ONLY to npc_service_role (not postgres superuser)
  - Supabase client connections use authenticated/anon roles via JWT (never npc_service_role)
  - All SECURITY DEFINER functions have fixed search_path to prevent schema hijacking
  
DEFENSE-IN-DEPTH IMPROVEMENTS:
  - npc_service_role has NO LOGIN capability (cannot be used for direct connections)
  - npc_service_role has minimal table privileges (SELECT on user_profiles, INSERT on connections, etc.)
  - npc_service_role is NOT a superuser (limited blast radius vs postgres role)
  - Functions owned by npc_service_role can only access tables explicitly granted
  
BOUNDARIES:
  - npc_service_role access limited to: SECURITY DEFINER function execution only
  - Client applications use authenticated/anon roles (connection string uses ANON_KEY)
  - postgres role still used for: dashboard admins and migrations (not function execution)
  - Functions should query minimal columns to reduce data exposure
  
Without this policy, is_admin() and other admin check functions would fail under FORCE RLS.';

-- Step 5: Verification queries (run manually to confirm)
-- Check function ownership:
-- SELECT p.proname, r.rolname as owner
-- FROM pg_proc p
-- JOIN pg_roles r ON p.proowner = r.oid
-- WHERE p.pronamespace = 'public'::regnamespace
--   AND p.prosecdef = true
-- ORDER BY p.proname;

-- Check role privileges:
-- SELECT * FROM information_schema.role_table_grants 
-- WHERE grantee = 'npc_service_role'
-- ORDER BY table_name;

-- Check policy grants:
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'user_profiles'
--   AND policyname = '__is_admin_helper_policy__';
