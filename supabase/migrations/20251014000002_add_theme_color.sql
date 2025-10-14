-- Migration: Add theme_color column to user_profiles
-- Description: Allows users to select custom theme colors for personalization
-- Author: NPC Finder Team
-- Date: 2025-10-14

-- Add theme_color column with purple as default (current theme)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'purple';

-- Add check constraint to ensure only valid theme colors
ALTER TABLE user_profiles
ADD CONSTRAINT valid_theme_color CHECK (
  theme_color IN ('purple', 'blue', 'teal', 'green', 'orange', 'pink', 'red', 'indigo')
);

-- Add index for faster lookups when filtering by theme
CREATE INDEX IF NOT EXISTS idx_user_profiles_theme_color ON user_profiles(theme_color);

-- Add column comment for documentation
COMMENT ON COLUMN user_profiles.theme_color IS 'User selected theme color. Valid values: purple, blue, teal, green, orange, pink, red, indigo. Defaults to purple.';
