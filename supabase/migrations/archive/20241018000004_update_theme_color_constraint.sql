-- Update theme_color to store custom hex colors only
-- This migration removes preset color constraints and allows any hex color
-- Applies to all existing users including active accounts

-- STEP 1: Convert all existing preset colors to hex codes FIRST
-- This must happen before dropping constraints to avoid data loss
-- Converts preset names to their hex equivalents for all users
UPDATE user_profiles
SET theme_color = CASE theme_color
  WHEN 'purple' THEN '#9333ea'
  WHEN 'blue' THEN '#2563eb'
  WHEN 'teal' THEN '#14b8a6'
  WHEN 'green' THEN '#16a34a'
  WHEN 'orange' THEN '#ea580c'
  WHEN 'pink' THEN '#ec4899'
  WHEN 'red' THEN '#dc2626'
  WHEN 'indigo' THEN '#6366f1'
  ELSE '#9333ea' -- Default to purple for any unknown/null values
END
WHERE theme_color IN ('purple', 'blue', 'teal', 'green', 'orange', 'pink', 'red', 'indigo')
   OR theme_color IS NULL;

-- STEP 2: Drop the old constraint from the column
-- This removes the CHECK constraint that only allowed preset color names
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_theme_color_check;

-- STEP 3: Add new constraint that validates hex color format only
-- Allows any valid 6-digit hex color code or NULL
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_theme_color_check 
CHECK (
  theme_color ~ '^#[0-9A-Fa-f]{6}$' -- Only allow hex color codes (#RRGGBB)
  OR theme_color IS NULL
);

-- STEP 4: Update the default value for new users
-- Change from 'blue' to the purple hex code
ALTER TABLE user_profiles 
ALTER COLUMN theme_color SET DEFAULT '#9333ea';

-- Add comment explaining the field
COMMENT ON COLUMN user_profiles.theme_color IS 
'User theme accent color as a hex code (#RRGGBB). This color is applied to buttons, links, and accents throughout the application. Users can customize this via the color picker in Settings.';
