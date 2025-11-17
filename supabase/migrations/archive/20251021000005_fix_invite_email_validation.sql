-- Fix validate_invite_code to prevent email bypass vulnerability
--
-- ISSUE:
-- The validation function only checks email match when BOTH intended_email 
-- AND user_email are not null. This allows bypass: an attacker could omit 
-- the email parameter to validate a code intended for someone else.
--
-- Current vulnerable logic:
--   IF code_record.intended_email IS NOT NULL AND user_email IS NOT NULL THEN
--     -- check match
--   END IF;
--   RETURN true;  -- ← Bypasses check if user_email is NULL!
--
-- SOLUTION:
-- If a code has an intended_email, REQUIRE user_email to be provided and match.
-- Return false if intended_email is set but user_email is missing or doesn't match.

CREATE OR REPLACE FUNCTION public.validate_invite_code(code_value text, user_email text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    code_record RECORD;
BEGIN
    SELECT * INTO code_record
    FROM public.invite_codes
    WHERE code = code_value;

    -- Code doesn't exist
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Code is not active
    IF NOT code_record.is_active THEN
        RETURN false;
    END IF;

    -- Code has expired
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
        RETURN false;
    END IF;

    -- Code has reached max uses
    IF code_record.current_uses >= code_record.max_uses THEN
        RETURN false;
    END IF;

    -- SECURITY FIX: If code has an intended email, email validation is REQUIRED
    -- This prevents bypass by omitting the email parameter
    IF code_record.intended_email IS NOT NULL THEN
        -- Email must be provided
        IF user_email IS NULL THEN
            RETURN false;
        END IF;
        
        -- Email must match (case-insensitive)
        IF LOWER(code_record.intended_email) != LOWER(user_email) THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_invite_code(text, text) IS 
'Validates an invite code with strict email checking.
If the code has an intended_email:
  - user_email MUST be provided (cannot be null)
  - user_email MUST match intended_email (case-insensitive)
Otherwise validation fails, preventing bypass attacks.';

-- Verify the function was updated correctly
-- Run this query to confirm:
-- SELECT 
--   p.prosrc 
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
--   AND p.proname = 'validate_invite_code'
--   AND array_length(p.proargtypes, 1) = 2;  -- The (text, text) version
