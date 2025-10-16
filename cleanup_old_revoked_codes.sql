-- Cleanup script for old revoked invite codes
-- Run this in your Supabase SQL Editor

-- This will delete all invite codes that have been deactivated (is_active = false)
-- These are codes that were revoked using the old system before we switched to DELETE

DELETE FROM invite_codes 
WHERE is_active = false;

-- Verify the cleanup
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as active_codes,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_codes,
  COUNT(*) as total_codes
FROM invite_codes;
