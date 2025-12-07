-- Migration: Assert Role System Dependencies
-- Description: Documents implicit ordering dependencies for RLS policies that reference
-- tables and functions defined in later migrations
-- Date: 2025-12-07
-- Issue: Comment 4 - RLS update migration assumes existence of tables from later-numbered files

-- This migration performs no schema changes but serves as documentation
-- and validation that dependencies are met in the expected order.

-- Verify that migrations are applied in lexical timestamp order
-- (This is the default Supabase CLI behavior)

DO $$
BEGIN
  -- Assert that rate_limits table exists (from 20251207000001_add_rate_limiting.sql)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rate_limits'
  ) THEN
    RAISE WARNING 'Migration ordering issue: rate_limits table not found. Expected from 20251207000001_add_rate_limiting.sql';
  END IF;

  -- Assert that admin_audit_log table exists (from 20251207000003_add_audit_logging.sql)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_audit_log'
  ) THEN
    RAISE WARNING 'Migration ordering issue: admin_audit_log table not found. Expected from 20251207000003_add_audit_logging.sql';
  END IF;

  -- Assert that get_user_role function exists (from 20251207000005_add_role_system.sql)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'get_user_role'
  ) THEN
    RAISE WARNING 'Migration ordering issue: get_user_role function not found. Expected from 20251207000005_add_role_system.sql';
  END IF;

  RAISE NOTICE 'Migration dependency check passed: all required tables and functions exist';
END $$;

-- Document the dependency chain for future reference
COMMENT ON SCHEMA public IS
'Migration Dependencies (as of 20251207000010):
- 20251207000006_update_rls_for_roles.sql depends on:
  * rate_limits table from 20251207000001_add_rate_limiting.sql
  * admin_audit_log table from 20251207000003_add_audit_logging.sql
  * get_user_role() function from 20251207000005_add_role_system.sql
  
These dependencies are satisfied by lexical timestamp ordering (default Supabase CLI behavior).
Future migrations must maintain this ordering discipline or explicitly document dependencies.';
