-- Fix user_profiles UPDATE policy to prevent privilege escalation
-- Users should not be able to change their own is_admin status

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policy that prevents users from changing is_admin
-- This uses a simpler approach: separate the UPDATE into two policies
-- One for regular fields, one for admin-controlled fields

-- Policy 1: Users can update their own non-admin fields
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a CHECK constraint at the table level to prevent is_admin changes
-- Wait, we can't do that easily. Let's use a trigger instead.

-- Create a function to prevent non-admins from changing is_admin
CREATE OR REPLACE FUNCTION prevent_is_admin_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_admin is being changed
  IF OLD.is_admin != NEW.is_admin THEN
    -- Check if the current user is an admin
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Only administrators can change admin status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce this
DROP TRIGGER IF EXISTS check_is_admin_change ON user_profiles;
CREATE TRIGGER check_is_admin_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_admin_change();
