-- Migration: Document is_admin Generated Column Design
-- Description: Adds comments clarifying that is_admin is now a generated column for backward compatibility
-- The authoritative flag is the 'role' enum; is_admin is derived from it
-- Date: 2025-12-07
-- Issue: Comment 3 - is_admin column reintroduced as generated without baseline update

-- Add comment to user_profiles.is_admin column clarifying its generated nature
COMMENT ON COLUMN user_profiles.is_admin IS
'DEPRECATED: Backward-compatibility column. This is now a GENERATED column derived from the role field.
The authoritative source for admin status is the role enum (admin or super_admin).
This column is maintained for backward compatibility with existing queries and code.
Do not attempt to set this column directly; modify the role column instead.';

-- Add comment to user_role enum explaining the role hierarchy
COMMENT ON TYPE user_role IS
'User role enumeration for the application.
- user: Standard user with no elevated privileges
- admin: Administrator with elevated privileges
- super_admin: Super administrator with maximum privileges and protection from role changes
The is_admin column in user_profiles is generated from this enum for backward compatibility.';

-- Add comment to the role column itself
COMMENT ON COLUMN user_profiles.role IS
'AUTHORITATIVE role field for user permissions.
Valid values: user, admin, super_admin.
The is_admin boolean column is automatically generated from this field:
  is_admin = (role IN (admin, super_admin))
Always modify this column to change user permissions, not the is_admin column.';
