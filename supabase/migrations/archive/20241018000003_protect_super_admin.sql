-- Protect the super admin account from having admin privileges revoked
-- IMPORTANT: Replace the UUID below with your own super admin user ID
-- To find your user ID: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Function to prevent revoking super admin privileges
CREATE OR REPLACE FUNCTION public.prevent_super_admin_revoke()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    super_admin_id UUID;
BEGIN
    -- CUSTOMIZE THIS: Replace with your super admin user ID
    -- This is NOT a security risk - user IDs are not authentication credentials
    -- Find yours with: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
    super_admin_id := 'adfa92d6-532b-47be-9101-bbfced9f73b4'::UUID;
    
    -- Only check if this is the super admin AND the is_admin field is being changed
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_super_admin_protection ON public.user_profiles;

-- Create trigger that runs before any update
CREATE TRIGGER enforce_super_admin_protection
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_super_admin_revoke();

-- Add comment for documentation
COMMENT ON FUNCTION public.prevent_super_admin_revoke() IS 
    'Prevents the designated super admin account from having admin privileges revoked. This ensures the platform always has at least one admin who cannot be locked out. Customize the UUID in the function to match your super admin user ID.';
