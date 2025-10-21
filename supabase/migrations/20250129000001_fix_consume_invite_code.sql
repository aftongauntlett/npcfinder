-- Fix consume_invite_code function to work without audit log table
-- The function was failing because it tried to insert into a non-existent audit_log table

CREATE OR REPLACE FUNCTION public.consume_invite_code(code_value TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
    is_valid BOOLEAN;
BEGIN
    -- First validate the code
    is_valid := public.validate_invite_code(code_value);
    
    IF NOT is_valid THEN
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
    
    -- Note: Removed audit logging since the table doesn't exist
    -- We can add it back later if needed
    
    RETURN true;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.consume_invite_code(TEXT, UUID) IS 'Consumes an invite code for a user registration. Updates usage count. (Fixed: removed audit logging)';
