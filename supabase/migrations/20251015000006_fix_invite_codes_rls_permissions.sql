-- Fix RLS policies for invite_codes to avoid permission issues with auth.users
-- Use a helper function with SECURITY DEFINER to safely check admin status

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================

-- Create a secure function to check if a user is the first (admin) user
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the provided user_id is the first user created
  RETURN user_id IN (
    SELECT id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
  );
END;
$$;

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can view their created codes" ON invite_codes;

-- Recreate policies using the helper function
CREATE POLICY "Admins can manage all invite codes"
  ON invite_codes
  FOR ALL
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can view their created codes"
  ON invite_codes
  FOR SELECT
  USING (created_by = auth.uid());

-- Update audit log policy
DROP POLICY IF EXISTS "Admins can view audit logs" ON invite_code_audit_log;

CREATE POLICY "Admins can view audit logs"
  ON invite_code_audit_log
  FOR SELECT
  USING (is_admin_user(auth.uid()));
