-- Migration: Add role-based permission system
-- Description: Replaces boolean is_admin with enum-based role system (user, admin, super_admin)
-- Author: System
-- Date: 2025-12-07

-- Step 1: Create enum type for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Step 2: Add role column (nullable initially for migration)
ALTER TABLE user_profiles 
  ADD COLUMN role user_role;

-- Step 3: Migrate existing data
-- Convert is_admin = true to 'admin', is_admin = false to 'user'
UPDATE user_profiles 
SET role = CASE 
  WHEN is_admin = true THEN 'admin'::user_role
  ELSE 'user'::user_role
END;

-- Step 4: Set super admin from app_config
-- The super admin user is determined from the app_config table
-- Only attempt if a valid UUID is configured
DO $$
DECLARE
  super_admin_config text;
  super_admin_id uuid;
BEGIN
  -- Get the config value
  SELECT value INTO super_admin_config
  FROM app_config 
  WHERE key = 'super_admin_user_id';
  
  -- Only proceed if config exists and is not the placeholder
  IF super_admin_config IS NOT NULL AND super_admin_config != 'PLACEHOLDER_SET_THIS_MANUALLY' THEN
    BEGIN
      -- Try to parse as UUID
      super_admin_id := super_admin_config::uuid;
      
      -- Update the user's role
      UPDATE user_profiles 
      SET role = 'super_admin'::user_role
      WHERE user_id = super_admin_id;
      
      RAISE NOTICE 'Super admin role assigned to user: %', super_admin_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not set super admin from app_config: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Skipping super admin assignment - app_config not set or is placeholder';
  END IF;
END $$;

-- Step 5: Make role non-nullable with default
ALTER TABLE user_profiles 
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Step 6: Create index for role queries
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Step 7: Convert is_admin to a generated column for backward compatibility
-- First, drop policies that depend on the is_admin column
DROP POLICY IF EXISTS "Admins can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can delete invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can update invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can read app config" ON app_config;
DROP POLICY IF EXISTS "Admins can update app config" ON app_config;

-- Drop the old is_admin column entirely
ALTER TABLE user_profiles 
  DROP COLUMN is_admin;

-- Recreate is_admin as a generated column based on role
ALTER TABLE user_profiles 
  ADD COLUMN is_admin BOOLEAN 
  GENERATED ALWAYS AS (role IN ('admin', 'super_admin')) STORED;

-- Recreate the policies using the new generated is_admin column
-- Note: These will be updated to use get_user_role() in migration 20251207000006

CREATE POLICY "Admins can create invite codes" ON invite_codes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete invite codes" ON invite_codes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update invite codes" ON invite_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can read app config" ON app_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update app config" ON app_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Step 8: Create new helper function for getting user role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid)
RETURNS user_role
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = check_user_id
  );
END;
$$;

-- Step 9: Update is_admin() function to use role field
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN get_user_role(check_user_id) IN ('admin', 'super_admin');
END;
$$;

-- Step 10: Add is_super_admin() helper function
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN get_user_role(check_user_id) = 'super_admin';
END;
$$;

-- Step 11: Update prevent_super_admin_revoke trigger function
CREATE OR REPLACE FUNCTION public.prevent_super_admin_revoke()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Prevent changing super_admin role to anything else
  IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    RAISE EXCEPTION 'Cannot change role of super administrator';
  END IF;
  
  -- Force super_admin role to stay (belt and suspenders approach)
  IF OLD.role = 'super_admin' THEN
    NEW.role := 'super_admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 12: Update prevent_admin_escalation_update trigger function
CREATE OR REPLACE FUNCTION public.prevent_admin_escalation_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- If role field is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only allow change if current user is an admin
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permission denied: Only admins can modify user roles'
        USING HINT = 'Contact an administrator to change your privileges.',
              ERRCODE = '42501';
    END IF;
    
    -- Prevent non-super-admins from creating super admins
    IF NEW.role = 'super_admin' AND NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permission denied: Only super admin can create super admins'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 13: Add comment documenting the role system
COMMENT ON TYPE user_role IS 'User role enum: user (default), admin (elevated access), super_admin (protected, cannot be demoted)';
COMMENT ON COLUMN user_profiles.role IS 'User role determining access level. Default is user. Admins can access all data. Super admin cannot be demoted.';
COMMENT ON FUNCTION get_user_role(uuid) IS 'Returns the role of the specified user. Used by RLS policies for permission checks.';
COMMENT ON FUNCTION is_admin(uuid) IS 'Returns true if user is admin or super_admin. Backward compatible wrapper around get_user_role().';
COMMENT ON FUNCTION is_super_admin(uuid) IS 'Returns true if user is super_admin. Used to protect super admin from demotion.';
