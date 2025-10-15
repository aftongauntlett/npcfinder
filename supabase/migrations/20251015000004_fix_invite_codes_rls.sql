-- Fix invite_codes RLS policies to use proper admin check
-- This migration updates the admin policy to use the first created user (admin)

-- Drop the old placeholder policy
DROP POLICY IF EXISTS "Admins can manage all invite codes" ON invite_codes;

-- Create a new admin policy that checks for the first user (typically the admin)
-- This is more secure than hardcoding emails
CREATE POLICY "Admins can manage all invite codes"
  ON invite_codes
  FOR ALL
  USING (
    -- Uses the first user created (typically the admin)
    -- For more security, you can manually specify: auth.uid() = 'your-uuid'::uuid
    auth.uid() IN (
      SELECT id FROM auth.users 
      ORDER BY created_at ASC 
      LIMIT 1
    )
  );

-- Grant execute permissions on validation functions to authenticated users
GRANT EXECUTE ON FUNCTION validate_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invite_code TO anon;
GRANT EXECUTE ON FUNCTION consume_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION consume_invite_code TO anon;
