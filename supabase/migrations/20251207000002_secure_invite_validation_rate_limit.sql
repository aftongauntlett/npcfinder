-- Migration: Add Rate Limiting to Invite Code Validation (M1)
-- Created: 2025-12-07
-- Purpose: Add server-side rate limiting to prevent brute force enumeration of invite codes
-- Depends on: 20251207000001_add_rate_limiting.sql

-- Update validate_invite_code to use server-side rate limiting
CREATE OR REPLACE FUNCTION public.validate_invite_code(
  code_value text,
  user_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_code record;
  v_now timestamptz := now();
  v_rate_limit_key text;
BEGIN
  -- SECURITY: Server-side rate limiting to prevent brute force enumeration
  -- Rate limit by email address to prevent unlimited attempts
  v_rate_limit_key := 'invite:' || lower(trim(user_email));
  
  IF NOT check_rate_limit(
    v_rate_limit_key,
    10,  -- max 10 attempts
    60,  -- within 60 minutes
    60   -- block for 60 minutes if exceeded
  ) THEN
    RAISE EXCEPTION 'Too many validation attempts. Please try again later.';
  END IF;

  -- Input validation
  IF code_value IS NULL OR trim(code_value) = '' THEN
    RETURN false;
  END IF;

  IF user_email IS NULL OR trim(user_email) = '' THEN
    RETURN false;
  END IF;

  -- Find the invite code
  SELECT * INTO v_code
  FROM invite_codes
  WHERE code = upper(trim(code_value))
    AND is_active = true;

  -- Code doesn't exist or is inactive
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if code has expired
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < v_now THEN
    RETURN false;
  END IF;

  -- Check if code has reached max uses
  IF v_code.current_uses >= v_code.max_uses THEN
    RETURN false;
  END IF;

  -- SECURITY: If code has an intended email, it MUST match
  -- This prevents code sharing and ensures invite is used by intended recipient
  IF v_code.intended_email IS NOT NULL THEN
    IF lower(trim(v_code.intended_email)) != lower(trim(user_email)) THEN
      RETURN false;
    END IF;
  END IF;

  -- All checks passed
  RETURN true;
END;
$$;

-- Update comment to reflect new security measures
COMMENT ON FUNCTION public.validate_invite_code(text, text) IS 
'Validates an invite code for a specific email address with server-side rate limiting.
SECURITY: Rate limited to 10 attempts per hour per email to prevent brute force enumeration.
Allows unauthenticated calls to support pre-signup validation, but protected by rate limiting.';
