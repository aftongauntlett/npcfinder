-- Migration: Add Admin Audit Logging (L2)
-- Created: 2025-12-07
-- Purpose: Log all admin actions for accountability and security monitoring

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_admin_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_target_user ON admin_audit_log(target_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- System can insert audit logs (via SECURITY DEFINER function)
CREATE POLICY "System can insert audit logs" ON admin_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Helper function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Get current user (must be authenticated)
  v_admin_user_id := auth.uid();
  
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to log admin actions';
  END IF;
  
  -- Verify user is actually an admin
  IF NOT is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Admin privileges required to log admin actions';
  END IF;
  
  -- Insert audit log entry
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    v_admin_user_id,
    p_action,
    p_target_user_id,
    p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION log_admin_action IS 'Logs admin actions for audit trail. Requires admin privileges. Returns the log entry ID.';

-- Grant execute to authenticated users (function checks admin status internally)
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;

-- Add comment to table
COMMENT ON TABLE admin_audit_log IS 'Audit trail of all admin actions for security monitoring and accountability';
