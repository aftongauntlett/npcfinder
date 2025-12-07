-- Migration: Align Super Admin Trigger to Config-Driven Implementation
-- Description: Redefines prevent_super_admin_revoke() to use app_config instead of hardcoded UUID
-- This supersedes the hardcoded version from 0001_baseline.sql
-- Date: 2025-12-07
-- Issue: Comment 1 - Baseline migration still hardcodes super admin UUID

-- Redefine prevent_super_admin_revoke to read from app_config
-- This ensures consistency with 20251205000002_super_admin_config.sql
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

-- Update function comment to reflect config-driven approach
COMMENT ON FUNCTION public.prevent_super_admin_revoke() IS 
'Prevents the super admin from having admin privileges revoked. 
Reads super_admin_user_id from app_config table instead of hardcoding.
This implementation supersedes the hardcoded version from baseline migration.';
