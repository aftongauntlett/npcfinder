-- Add missing profile fields
-- Adds bio, profile_picture_url, visible_cards, and email to user_profiles table

-- Add bio field
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add profile picture URL
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add visible cards (dashboard customization)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS visible_cards TEXT[];

-- Add email (denormalized from auth.users for easier queries)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for search
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update the theme_color constraint to include all supported colors
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_theme_color_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_theme_color_check 
CHECK (theme_color IN ('blue', 'purple', 'pink', 'green', 'orange', 'red', 'teal', 'indigo'));

-- Update existing profiles to populate email from auth.users
UPDATE user_profiles 
SET email = auth.users.email
FROM auth.users 
WHERE user_profiles.user_id = auth.users.id 
  AND user_profiles.email IS NULL;
