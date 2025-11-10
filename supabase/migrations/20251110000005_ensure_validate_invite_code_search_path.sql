-- Migration: Ensure search_path is set on single-arg validate_invite_code
-- Date: November 10, 2025
-- Purpose: Security hardening - prevent schema hijacking on SECURITY DEFINER function
--
-- The single-argument validate_invite_code function is SECURITY DEFINER but may be
-- missing the search_path setting. This migration ensures it's set to prevent
-- potential schema hijacking attacks where malicious users could create functions
-- in other schemas that get called with elevated privileges.
--
-- This is idempotent - if search_path is already set, this just recreates the function.

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

-- Ensure ownership and grants are correct
ALTER FUNCTION "public"."validate_invite_code"("code_value" "text") OWNER TO "npc_service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_invite_code"("code_value" "text") TO anon;
GRANT EXECUTE ON FUNCTION "public"."validate_invite_code"("code_value" "text") TO authenticated;

COMMENT ON FUNCTION "public"."validate_invite_code"("code_value" "text") IS 'Validates an invite code without consuming it. Returns true if code is valid and available. SECURITY DEFINER with fixed search_path.';
