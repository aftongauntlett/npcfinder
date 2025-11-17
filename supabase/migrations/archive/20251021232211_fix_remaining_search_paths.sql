-- Migration: Fix Remaining Function Search Paths
-- Date: October 21, 2025
-- Purpose: Add SET search_path to 6 functions flagged by Supabase Security Advisor
--
-- SECURITY ISSUE: Functions without fixed search_path are vulnerable to schema hijacking attacks
-- where malicious actors can create functions/tables in other schemas to intercept calls.
--
-- This migration adds SET search_path to:
-- 1. validate_invite_code(code_value text) - CRITICAL (SECURITY DEFINER function)
-- 2. update_user_profiles_updated_at() - Trigger function
-- 3. update_music_rec_consumed_at() - Trigger function
-- 4. update_movie_rec_watched_at() - Trigger function
-- 5. update_watchlist_updated_at() - Trigger function
-- 6. verify_data_integrity() - Admin utility function
--
-- All function logic remains identical; only the search_path clause is added.

-- DEFENSIVE: Ensure npc_service_role exists before altering function ownership
-- This migration alters validate_invite_code owner to npc_service_role.
-- If role creation migration hasn't run yet, create it defensively here.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'npc_service_role') THEN
        CREATE ROLE npc_service_role NOLOGIN;
        -- Minimal grants will be in the dedicated role-creation migration
    END IF;
END $$;

-- 1. validate_invite_code (1-parameter version) - CRITICAL SECURITY DEFINER FUNCTION
CREATE OR REPLACE FUNCTION "public"."validate_invite_code"("code_value" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Find the invite code
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE code = code_value
    AND is_active = true;
    
    -- Code doesn't exist or is inactive
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if code has reached max uses
    IF invite_record.current_uses >= invite_record.max_uses THEN
        RETURN false;
    END IF;
    
    -- Check if code has expired
    IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
        RETURN false;
    END IF;
    
    -- Code is valid
    RETURN true;
END;
$$;

ALTER FUNCTION "public"."validate_invite_code"("code_value" "text") OWNER TO "npc_service_role";

-- Grant EXECUTE to anon role (called during signup flow before authentication)
-- This function is read-only and safe for unauthenticated access
GRANT EXECUTE ON FUNCTION "public"."validate_invite_code"("code_value" "text") TO anon;

COMMENT ON FUNCTION "public"."validate_invite_code"("code_value" "text") IS 'Validates an invite code without consuming it. Returns true if code is valid and available.';


-- 2. update_user_profiles_updated_at - Trigger function
CREATE OR REPLACE FUNCTION "public"."update_user_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_user_profiles_updated_at"() OWNER TO "postgres";


-- 3. update_music_rec_consumed_at - Trigger function
CREATE OR REPLACE FUNCTION "public"."update_music_rec_consumed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- If status is being changed from 'pending' to consumed/hit/miss, set consumed_at
  IF OLD.status = 'pending' AND NEW.status IN ('consumed', 'hit', 'miss') THEN
    NEW.consumed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_music_rec_consumed_at"() OWNER TO "postgres";


-- 4. update_movie_rec_watched_at - Trigger function
CREATE OR REPLACE FUNCTION "public"."update_movie_rec_watched_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- If status is being changed from 'pending' to watched/hit/miss, set watched_at
  IF OLD.status = 'pending' AND NEW.status IN ('watched', 'hit', 'miss') THEN
    NEW.watched_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_movie_rec_watched_at"() OWNER TO "postgres";


-- 5. update_watchlist_updated_at - Trigger function
CREATE OR REPLACE FUNCTION "public"."update_watchlist_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Only update watched_at if this is an UPDATE operation (not INSERT)
  IF TG_OP = 'UPDATE' THEN
    -- Set watched_at when watched status changes to true
    IF NEW.watched = true AND OLD.watched = false THEN
      NEW.watched_at = NOW();
    END IF;
    
    -- Clear watched_at when watched status changes to false
    IF NEW.watched = false AND OLD.watched = true THEN
      NEW.watched_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_watchlist_updated_at"() OWNER TO "postgres";


-- 6. verify_data_integrity - Admin/dashboard utility function
-- NOTE: This function is intended for dashboard use only (run as postgres role).
-- It queries auth.users which requires elevated privileges.
-- DO NOT expose this via RPC or grant to authenticated users.
CREATE OR REPLACE FUNCTION "public"."verify_data_integrity"() RETURNS TABLE("table_name" "text", "invalid_count" bigint, "message" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
BEGIN
  -- Check user_profiles
  RETURN QUERY
  SELECT 
    'user_profiles'::TEXT,
    COUNT(*)::BIGINT,
    'Orphaned profiles (user deleted from auth.users)'::TEXT
  FROM user_profiles up
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = up.user_id);
  
  -- Check connections
  RETURN QUERY
  SELECT 
    'connections'::TEXT,
    COUNT(*)::BIGINT,
    'Connections with invalid user_id'::TEXT
  FROM connections c
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = c.user_id);
  
  RETURN QUERY
  SELECT 
    'connections'::TEXT,
    COUNT(*)::BIGINT,
    'Connections with invalid friend_id'::TEXT
  FROM connections c
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = c.friend_id);
END;
$$;

ALTER FUNCTION "public"."verify_data_integrity"() OWNER TO "postgres";

-- Revoke public access to prevent unauthorized use
REVOKE ALL ON FUNCTION "public"."verify_data_integrity"() FROM PUBLIC;
-- Only postgres role (dashboard) can execute this function


-- Verification Query (commented out - run manually if needed)
-- This checks if any functions in the public schema still lack search_path configuration
-- SELECT proname, proconfig 
-- FROM pg_proc p 
-- JOIN pg_namespace n ON p.pronamespace = n.oid 
-- WHERE n.nspname = 'public' AND proconfig IS NULL;
