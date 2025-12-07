-- Migration: Document Admin Override Policies Applied Manually
-- Description: Documents that admin override policies were applied manually on 2025-12-06
-- This migration adds comments to affected tables to preserve audit trail
-- Date: 2025-12-07
-- Issue: Comment 5 - Placeholder migration represents manual production changes

-- Add documentation comments to key tables that received manual admin override policies
-- This preserves the audit trail without attempting to reconstruct the exact SQL

COMMENT ON TABLE task_boards IS
'User task boards with role-based RLS.
HISTORY: Admin override policies were applied manually on 2025-12-06 (see 20251206_add_admin_override_policies.sql placeholder).
Current RLS state includes admin overrides via get_user_role() checks.';

COMMENT ON TABLE user_profiles IS
'User profile information with role-based access control.
HISTORY: Admin override policies were applied manually on 2025-12-06 (see 20251206_add_admin_override_policies.sql placeholder).
Current RLS state updated in 20251207000006_update_rls_for_roles.sql.';

COMMENT ON TABLE invite_codes IS
'Invite code management with admin-only access.
HISTORY: Admin override policies were applied manually on 2025-12-06 (see 20251206_add_admin_override_policies.sql placeholder).
Current RLS enforces admin-only operations.';

-- Document this one-off manual application in the migration history
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251206_add_admin_override_policies was applied manually to production on 2025-12-06';
  RAISE NOTICE 'This migration documents those changes without reconstructing the exact SQL';
  RAISE NOTICE 'All future changes must use proper migration files to avoid diff drift';
END $$;
