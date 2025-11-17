-- Create invite_codes table for secure invite-only registration
-- This table manages invite codes that gate user registration

CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_max_uses CHECK (max_uses > 0),
    CONSTRAINT valid_current_uses CHECK (current_uses >= 0 AND current_uses <= max_uses),
    CONSTRAINT used_at_requires_used_by CHECK (used_at IS NULL OR used_by IS NOT NULL)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON public.invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON public.invite_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active ON public.invite_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON public.invite_codes(expires_at);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_codes TO authenticated;

-- RLS Policies
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can validate codes (needed for registration page)
CREATE POLICY "Anyone can validate invite codes"
    ON public.invite_codes
    FOR SELECT
    USING (true);

-- Policy: Only admins can insert codes
CREATE POLICY "Admins can create invite codes"
    ON public.invite_codes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- Policy: Only admins can update codes
CREATE POLICY "Admins can update invite codes"
    ON public.invite_codes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- Policy: Only admins can delete codes
CREATE POLICY "Admins can delete invite codes"
    ON public.invite_codes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- Function: Validate an invite code
CREATE OR REPLACE FUNCTION public.validate_invite_code(code_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function: Consume an invite code
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
    
    -- Log the usage in audit table
    INSERT INTO public.invite_code_audit_log (
        invite_code_id,
        code,
        used_by,
        action,
        metadata
    ) VALUES (
        invite_record.id,
        code_value,
        user_id,
        'consumed',
        jsonb_build_object(
            'use_number', invite_record.current_uses + 1,
            'max_uses', invite_record.max_uses
        )
    );
    
    RETURN true;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.validate_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.consume_invite_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_invite_code(TEXT, UUID) TO anon;

-- Add comment for documentation
COMMENT ON TABLE public.invite_codes IS 'Manages invite codes for secure user registration. Supports single-use and multi-use codes with expiration dates.';
COMMENT ON FUNCTION public.validate_invite_code(TEXT) IS 'Validates an invite code without consuming it. Returns true if code is valid and available.';
COMMENT ON FUNCTION public.consume_invite_code(TEXT, UUID) IS 'Consumes an invite code for a user registration. Updates usage count and logs the action.';
