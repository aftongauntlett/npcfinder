-- Migration: Add Server-Side Rate Limiting for Auth Flows (Comment 2)
-- Created: 2025-12-07
-- Purpose: Add server-side rate limiting to sign-in and sign-up flows
-- Depends on: 20251207000001_add_rate_limiting.sql

-- Create a function to check rate limit before sign-in
-- This will be called from auth hooks or client code before attempting sign-in
CREATE OR REPLACE FUNCTION check_signin_rate_limit(
  user_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit_key TEXT;
  v_is_allowed BOOLEAN;
BEGIN
  -- Construct rate limit key
  v_rate_limit_key := 'signin:' || lower(trim(user_email));
  
  -- Check rate limit: 5 attempts per 15 minutes
  v_is_allowed := check_rate_limit(
    v_rate_limit_key,
    5,   -- max 5 attempts
    15,  -- within 15 minutes
    15   -- block for 15 minutes if exceeded
  );
  
  IF NOT v_is_allowed THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Too many login attempts. Please try again in 15 minutes.'
    );
  END IF;
  
  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Create a function to check rate limit before sign-up
CREATE OR REPLACE FUNCTION check_signup_rate_limit(
  user_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit_key TEXT;
  v_is_allowed BOOLEAN;
BEGIN
  -- Construct rate limit key
  v_rate_limit_key := 'signup:' || lower(trim(user_email));
  
  -- Check rate limit: 3 attempts per hour
  v_is_allowed := check_rate_limit(
    v_rate_limit_key,
    3,   -- max 3 attempts
    60,  -- within 60 minutes
    60   -- block for 60 minutes if exceeded
  );
  
  IF NOT v_is_allowed THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Too many signup attempts. Please try again later.'
    );
  END IF;
  
  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Create a function to reset rate limit on successful authentication
-- This should be called after successful sign-in/sign-up
CREATE OR REPLACE FUNCTION reset_auth_rate_limit(
  user_email TEXT,
  auth_type TEXT -- 'signin' or 'signup'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit_key TEXT;
BEGIN
  -- Construct rate limit key
  v_rate_limit_key := auth_type || ':' || lower(trim(user_email));
  
  -- Delete the rate limit record to reset
  DELETE FROM rate_limits WHERE key = v_rate_limit_key;
END;
$$;

-- Add comments
COMMENT ON FUNCTION check_signin_rate_limit IS 'Server-side rate limiting for sign-in attempts. Returns JSONB with allowed status and optional error message.';
COMMENT ON FUNCTION check_signup_rate_limit IS 'Server-side rate limiting for sign-up attempts. Returns JSONB with allowed status and optional error message.';
COMMENT ON FUNCTION reset_auth_rate_limit IS 'Resets rate limit after successful authentication. Call this on successful sign-in or sign-up.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_signin_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_signin_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION check_signup_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_signup_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION reset_auth_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION reset_auth_rate_limit TO anon;
