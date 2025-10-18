-- Fix the super admin protection trigger to only block when is_admin is actually being changed
-- This allows other profile fields (like theme_color) to be updated without triggering the protection
-- IMPORTANT: Replace the UUID below with your own super admin user ID

-- Update the function to check if is_admin is actually being modified
CREATE OR REPLACE FUNCTION public.prevent_super_admin_revoke()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    super_admin_id UUID;
BEGIN
    -- CUSTOMIZE THIS: Replace with your super admin user ID
    -- Find yours with: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
    super_admin_id := 'adfa92d6-532b-47be-9101-bbfced9f73b4'::UUID;
    
    -- Only check if this is the super admin AND the is_admin field is being changed
    -- Using IS DISTINCT FROM to properly handle NULL cases
    IF NEW.user_id = super_admin_id AND (OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
        -- If someone tries to revoke admin privileges from super admin
        IF NEW.is_admin = false AND OLD.is_admin = true THEN
            RAISE EXCEPTION 'Cannot revoke admin privileges from the super admin account'
                USING HINT = 'This account is permanently protected. Contact database administrator if you need to make changes.';
        END IF;
        
        -- Force is_admin to always be true for super admin
        NEW.is_admin := true;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.prevent_super_admin_revoke() IS 
    'Prevents the designated super admin account from having admin privileges revoked. Updated to only check when is_admin field is actually being modified, allowing other profile updates. Customize the UUID in the function to match your super admin user ID.';
