-- Migration: Add visible_cards column to user_profiles
-- Description: Allows users to customize which dashboard cards they see
-- Author: NPC Finder Team
-- Date: 2025-10-14

-- Add visible_cards column with all cards visible by default
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS visible_cards JSONB DEFAULT '["movies-tv", "music", "games", "fitness", "food-places", "journal", "news", "bookmarks", "vault"]'::jsonb;

-- Add GIN index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_visible_cards ON user_profiles USING GIN (visible_cards);

-- Add column comment for documentation
COMMENT ON COLUMN user_profiles.visible_cards IS 'Array of card IDs that the user wants visible on their dashboard. Default shows all cards.';
