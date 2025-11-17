-- Fix consume_invite_code to work with updated validate_invite_code function
-- The validate_invite_code now takes an optional email parameter, but consume doesn't need it

CREATE OR REPLACE FUNCTION public.consume_invite_code(code_value TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
    code_exists BOOLEAN;
BEGIN
    -- Check if code exists and is valid (without email validation)
    SELECT EXISTS(
        SELECT 1 
        FROM public.invite_codes
        WHERE code = code_value
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND current_uses < max_uses
    ) INTO code_exists;
    
    IF NOT code_exists THEN
        RETURN false;
    END IF;
    
    -- Get the invite code record with row lock
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE code = code_value
    FOR UPDATE;
    
    -- Update the code
    UPDATE public.invite_codes
    SET 
        current_uses = current_uses + 1,
        used_by = CASE 
            WHEN current_uses = 0 THEN user_id 
            ELSE used_by 
        END,
        used_at = CASE 
            WHEN current_uses = 0 THEN NOW() 
            ELSE used_at 
        END
    WHERE code = code_value;
    
    RETURN true;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.consume_invite_code(TEXT, UUID) IS 'Consumes an invite code for a user registration. Updates usage count and marks as used.';
