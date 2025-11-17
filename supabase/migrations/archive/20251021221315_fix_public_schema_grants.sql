-- Migration: Fix public schema grants to prevent unrestricted access
-- Date: 2025-10-21
-- Description: Replace blanket GRANT ALL ON SCHEMA public TO PUBLIC with specific, 
--              restricted grants. Only grant USAGE to authenticated role, no CREATE.
--
-- Security Issue: The current grants in database_schema.sql:
--   REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
--   GRANT ALL ON SCHEMA "public" TO PUBLIC;
-- This negates the REVOKE by granting ALL (including CREATE, USAGE) back to PUBLIC.
--
-- Fix: Grant only USAGE to authenticated users, no CREATE privilege on the schema.

-- =====================================================
-- STEP 1: Revoke all permissions on public schema from PUBLIC role
-- =====================================================

-- Remove all existing permissions from PUBLIC
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- =====================================================
-- STEP 2: Grant specific, minimal permissions to authenticated role
-- =====================================================

-- Grant USAGE (can access objects) but NOT CREATE (cannot create objects)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Note: postgres role retains full ownership and all privileges
-- anon role has no schema-level grants (will rely on explicit function grants)

-- =====================================================
-- STEP 3: Verify function grants are explicit and minimal
-- =====================================================

-- These function grants should already exist, but we verify they're explicit
-- (not relying on blanket PUBLIC grants)

-- validate_invite_code - needs both anon and authenticated for signup flow
-- Already has explicit grants, no change needed

-- consume_invite_code - authenticated only (already granted in schema)
-- Already has explicit grant, no change needed

-- is_admin - authenticated only
-- Already has explicit REVOKE + GRANT pattern, no change needed

-- prevent_admin_escalation_update/prevent_admin_self_grant - authenticated only
-- Already have explicit REVOKE + GRANT pattern, no change needed

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After running this migration, verify with:
-- 
-- SELECT 
--   n.nspname as schema_name,
--   r.rolname as role_name,
--   p.privilege_type
-- FROM information_schema.role_usage_grants p
-- JOIN pg_catalog.pg_roles r ON r.rolname = p.grantee
-- JOIN pg_catalog.pg_namespace n ON n.nspname = p.object_schema
-- WHERE n.nspname = 'public'
-- ORDER BY role_name, privilege_type;
--
-- Expected results:
-- - authenticated: USAGE
-- - postgres: USAGE, CREATE (owner)
-- - PUBLIC: (nothing - no grants)
-- - anon: (nothing - relies on explicit function grants)

-- =====================================================
-- SECURITY IMPACT
-- =====================================================
-- 
-- BEFORE: PUBLIC (anyone) could CREATE objects in public schema
-- AFTER:  Only authenticated users can USE (access) objects
--         Only postgres (owner) can CREATE objects
--         anon can only call explicitly granted functions (validate_invite_code)
