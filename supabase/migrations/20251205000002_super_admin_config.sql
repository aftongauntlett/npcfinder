-- Migration: Move Super Admin to Database Config
-- SECURITY: Remove hardcoded super admin ID from migration
-- Date: 2025-12-05
-- Issue: M4 - Super admin UUID hardcoded in migration

-- Step 1: Add super admin configuration to app_config table
-- Note: The actual super admin ID should be inserted manually by the deployment script
-- This migration creates the structure but doesn't hardcode the ID

-- Create app_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write config
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

-- Step 2: Update the prevent_super_admin_revoke trigger to read from config
CREATE OR REPLACE FUNCTION public.prevent_super_admin_revoke()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  super_admin_id UUID;
  super_admin_config text;
BEGIN
  -- Get super admin ID from config
  SELECT value INTO super_admin_config
  FROM app_config
  WHERE key = 'super_admin_user_id';

  -- If no super admin configured, allow the update
  -- This prevents the trigger from blocking all updates if config is missing
  IF super_admin_config IS NULL THEN
    RETURN NEW;
  END IF;

  -- Parse UUID from config
  BEGIN
    super_admin_id := super_admin_config::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      -- If config value is not a valid UUID, log warning and allow update
      RAISE WARNING 'Invalid super_admin_user_id in app_config: %', super_admin_config;
      RETURN NEW;
  END;

  -- Prevent revoking admin from super admin
  IF NEW.user_id = super_admin_id AND NEW.is_admin = false THEN
    RAISE EXCEPTION 'Cannot revoke admin privileges from the super administrator';
  END IF;

  RETURN NEW;
END;
$$;

-- Add comment explaining the config key
COMMENT ON TABLE app_config IS 
'Application configuration key-value store. 
SECURITY: Protected by RLS - only admins can access.
Used for sensitive configuration like super_admin_user_id.';

-- Step 3: Insert placeholder for super admin (to be updated manually)
INSERT INTO app_config (key, value, description)
VALUES (
  'super_admin_user_id',
  'PLACEHOLDER_SET_THIS_MANUALLY',
  'User ID of the super administrator (protected from admin revocation). MUST be set to a valid UUID before use.'
)
ON CONFLICT (key) DO NOTHING;

-- Step 4: Create helper function to update super admin (admin-only)
CREATE OR REPLACE FUNCTION public.set_super_admin(new_super_admin_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Only current admins can change super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can set the super admin';
  END IF;

  -- Verify the new super admin exists and is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = new_super_admin_id
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Super admin must be an existing admin user';
  END IF;

  -- Update the config
  UPDATE app_config
  SET value = new_super_admin_id::text,
      updated_at = now()
  WHERE key = 'super_admin_user_id';

  RAISE NOTICE 'Super admin updated to: %', new_super_admin_id;
END;
$$;

COMMENT ON FUNCTION public.set_super_admin(UUID) IS 
'Update the super administrator. Can only be called by existing admins.
The new super admin must already be an admin user.';
