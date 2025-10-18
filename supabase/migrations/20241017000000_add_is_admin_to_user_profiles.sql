-- Migration: Add is_admin column to user_profiles table
-- Date: 2024-10-17
-- Description: Adds a boolean column to track admin users in the database

-- Add is_admin column with default false
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

-- Create index on is_admin for faster admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin 
ON user_profiles(is_admin) 
WHERE is_admin = true;

-- Optional: Set existing admin user based on environment variable
-- Uncomment and replace with your admin user ID if needed:
-- UPDATE user_profiles 
-- SET is_admin = true 
-- WHERE user_id = 'your-admin-user-id-here';

-- Add comment to column for documentation
COMMENT ON COLUMN user_profiles.is_admin IS 'Indicates whether the user has admin privileges (access to admin panel, invite code management, etc.)';
