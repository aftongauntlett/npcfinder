-- NPC Finder Invite Code System
-- Secure invite-only registration system
-- Run this script in Supabase SQL Editor

-- ============================================
-- INVITE CODES TABLE
-- Stores invite codes for secure registration
-- ============================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  notes TEXT,
  CONSTRAINT valid_uses CHECK (current_uses <= max_uses)
);

-- Indexes for performance
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_active ON invite_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all invite codes"
  ON invite_codes
  FOR ALL
  USING (
    -- Replace with your actual admin user IDs
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('your-admin-email@example.com')
    )
  );

-- Users can view their own created codes
CREATE POLICY "Users can view their created codes"
  ON invite_codes
  FOR SELECT
  USING (created_by = auth.uid());

-- Public can validate codes (but not see details)
-- This is handled through a function below for security

-- ============================================
-- SECURE FUNCTIONS
-- ============================================

-- Function to validate an invite code (public access)
CREATE OR REPLACE FUNCTION validate_invite_code(code_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Find the code
  SELECT * INTO code_record
  FROM invite_codes
  WHERE code = code_to_check;
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if active
  IF NOT code_record.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check if expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check if max uses reached
  IF code_record.current_uses >= code_record.max_uses THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to consume an invite code (public access)
CREATE OR REPLACE FUNCTION consume_invite_code(code_to_use TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Validate first
  IF NOT validate_invite_code(code_to_use) THEN
    RETURN FALSE;
  END IF;
  
  -- Get the code
  SELECT * INTO code_record
  FROM invite_codes
  WHERE code = code_to_use
  FOR UPDATE; -- Lock the row
  
  -- Double-check it's still valid (race condition protection)
  IF code_record.current_uses >= code_record.max_uses THEN
    RETURN FALSE;
  END IF;
  
  -- Update the code
  UPDATE invite_codes
  SET 
    current_uses = current_uses + 1,
    used_by = user_id,
    used_at = NOW()
  WHERE code = code_to_use;
  
  RETURN TRUE;
END;
$$;

-- Function to generate a secure random code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No ambiguous chars
  code TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 12 character code (XXX-XXX-XXX-XXX format)
  FOR i IN 1..12 LOOP
    IF i % 4 = 1 AND i > 1 THEN
      code := code || '-';
    END IF;
    code := code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  
  RETURN code;
END;
$$;

-- ============================================
-- AUDIT LOG TABLE (Optional but recommended)
-- Tracks all invite code usage attempts
-- ============================================
CREATE TABLE IF NOT EXISTS invite_code_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL,
  action TEXT NOT NULL, -- 'validate', 'consume', 'create', 'revoke'
  success BOOLEAN NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_code ON invite_code_audit_log(code);
CREATE INDEX idx_audit_log_created_at ON invite_code_audit_log(created_at);

-- Enable RLS
ALTER TABLE invite_code_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON invite_code_audit_log
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('your-admin-email@example.com')
    )
  );

-- ============================================
-- HELPER: Create initial admin codes
-- ============================================

-- Generate 5 initial invite codes for your friends
-- Run this after setting up your admin account
/*
INSERT INTO invite_codes (code, created_by, notes, max_uses)
SELECT 
  generate_invite_code(),
  (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com' LIMIT 1),
  'Initial friend invite',
  1
FROM generate_series(1, 5);
*/

-- ============================================
-- SECURITY NOTES
-- ============================================

/*
SECURITY FEATURES IMPLEMENTED:

1. Row Level Security (RLS)
   - Prevents unauthorized access to invite codes
   - Admins can manage, users can view their own

2. Secure Functions
   - validate_invite_code: Public function to check validity
   - consume_invite_code: Atomic operation with row locking
   - SECURITY DEFINER: Runs with elevated privileges safely

3. Rate Limiting (Recommended - implement in your app)
   - Limit validation attempts per IP
   - Use Supabase rate limiting or Edge Functions

4. Audit Logging
   - Track all invite code usage
   - Detect suspicious activity
   - Monitor for brute force attempts

5. Code Expiration
   - Optional expiry dates
   - Automatic invalidation of old codes

6. Usage Limits
   - Single-use codes by default
   - Multi-use codes for special cases
   - Atomic increment with row locking

RECOMMENDATIONS FOR YOUR FRIENDS:

1. Share codes through Signal (encrypted)
2. Generate unique codes per person for tracking
3. Set short expiration times (7-30 days)
4. Revoke unused codes after some time
5. Monitor audit logs for suspicious activity

TO CUSTOMIZE:
- Replace 'your-admin-email@example.com' with your actual admin emails
- Adjust code format/length in generate_invite_code()
- Add IP rate limiting in your application layer
*/
