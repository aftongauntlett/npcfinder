-- Migration: Secure consume_invite_code function
-- Date: 2025-10-21
-- Description: Removes anon role access and adds user_id verification guard

-- Remove anon grant to prevent unauthenticated code consumption
REVOKE ALL ON FUNCTION public.consume_invite_code(text, uuid) FROM anon;

-- Recreate function with security guard
CREATE OR REPLACE FUNCTION public.consume_invite_code(code_value text, user_id uuid) 
RETURNS boolean
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
    code_exists BOOLEAN;
BEGIN
    -- Security guard: Verify user_id matches authenticated user
    IF user_id != auth.uid() THEN
        RAISE EXCEPTION 'User ID mismatch: cannot consume invite code for another user';
    END IF;
    
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

-- Ensure only authenticated users can execute this function
GRANT EXECUTE ON FUNCTION public.consume_invite_code(text, uuid) TO authenticated;

COMMENT ON FUNCTION public.consume_invite_code(text, uuid) IS 'Consumes an invite code for a user registration. Requires authenticated user and validates user_id matches caller. Updates usage count and marks as used.';
