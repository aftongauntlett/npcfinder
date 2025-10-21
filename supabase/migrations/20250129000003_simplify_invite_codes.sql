-- Simplify invite code system
-- Add intended_email column for email-based validation
-- This adds an extra security layer: codes can only be used by the intended recipient

-- Add intended_email column
ALTER TABLE public.invite_codes 
ADD COLUMN IF NOT EXISTS intended_email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_intended_email 
ON public.invite_codes(intended_email);

-- Update validate_invite_code to check email match
CREATE OR REPLACE FUNCTION public.validate_invite_code(code_value TEXT, user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
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

    -- NEW: If code has an intended email, check if it matches
    IF code_record.intended_email IS NOT NULL AND user_email IS NOT NULL THEN
        IF LOWER(code_record.intended_email) != LOWER(user_email) THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_invite_code(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(TEXT, TEXT) TO anon;

-- Update comment
COMMENT ON FUNCTION public.validate_invite_code(TEXT, TEXT) IS 'Validates an invite code, optionally checking if the email matches the intended recipient.';
