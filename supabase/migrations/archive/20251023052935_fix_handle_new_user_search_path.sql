-- Fix handle_new_user() function to use proper search_path and schema qualification
--
-- ISSUE:
-- The handle_new_user() function is a SECURITY DEFINER function but lacks:
-- 1. Fixed search_path (security vulnerability - schema hijacking)
-- 2. Proper schema qualification for auth.users access
--
-- SYMPTOM:
-- Error: "permission denied for schema auth" (code 42501)
-- when trying to upsert user_profiles
--
-- ROOT CAUSE:
-- The function accesses NEW.raw_user_meta_data and NEW.email from auth.users trigger,
-- but without explicit search_path, it may not properly access auth schema.
-- Additionally, all SECURITY DEFINER functions should have fixed search_path.
--
-- FIX:
-- 1. Add SET search_path = public, pg_temp to prevent schema hijacking
-- 2. Ensure proper schema qualification (already using public.user_profiles)

-- Drop and recreate the function with fixed search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.email
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- Ensure function is still owned by npc_service_role
ALTER FUNCTION public.handle_new_user() OWNER TO npc_service_role;

-- Add comment explaining security context
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates user profile when new user signs up in auth.users.

SECURITY CONTEXT:
  - SECURITY DEFINER: Runs with npc_service_role privileges (has INSERT on user_profiles)
  - Fixed search_path: Prevents schema hijacking attacks
  - Owner: npc_service_role (minimal privileges role, not postgres superuser)
  - Trigger: AFTER INSERT ON auth.users (called by Supabase Auth system)

DATA FLOW:
  1. User signs up via Supabase Auth
  2. Record inserted into auth.users
  3. This trigger fires automatically
  4. Profile created with display_name from metadata or email fallback

DEFENSE-IN-DEPTH:
  - Function only has access to tables granted to npc_service_role
  - Cannot be called directly by users (trigger-only)
  - Search path fixed to prevent malicious schema injection';

-- Verification (run manually):
-- SELECT p.proname, p.prosrc, p.prosecdef, 
--        pg_get_function_identity_arguments(p.oid) as args,
--        pg_get_functiondef(p.oid) as full_definition
-- FROM pg_proc p
-- WHERE p.proname = 'handle_new_user'
--   AND p.pronamespace = 'public'::regnamespace;
