-- Create game_library table for personal game tracking
-- Matches the pattern of reading_list and music_library tables
-- Supports games from RAWG API
-- Field names align with RAWG API response format for consistency

CREATE TABLE IF NOT EXISTS game_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Game information (matches RAWG API structure)
  external_id text NOT NULL, -- RAWG game ID
  slug text NOT NULL, -- URL-friendly game identifier
  name text NOT NULL, -- Game title
  released text, -- Release date (YYYY-MM-DD format from RAWG)
  background_image text, -- Main game image URL
  
  -- Platform and genre data (stored as comma-separated text)
  platforms text, -- Comma-separated list of platform names (e.g., "PC, PlayStation 5, Xbox Series X")
  genres text, -- Comma-separated list of genre names (e.g., "Action, RPG, Adventure")
  
  -- Additional metadata
  rating numeric(3,2), -- RAWG rating (0.00-5.00)
  metacritic integer, -- Metacritic score (0-100)
  playtime integer, -- Average playtime in hours
  
  -- Personal tracking
  played boolean DEFAULT false, -- false = playing/backlog, true = played/completed
  personal_rating integer CHECK (personal_rating >= 1 AND personal_rating <= 5),
  personal_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  played_at timestamptz, -- When marked as played
  
  -- Prevent duplicate entries for same user
  UNIQUE(user_id, external_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_library_user_id ON game_library(user_id);
CREATE INDEX IF NOT EXISTS idx_game_library_played ON game_library(user_id, played);
CREATE INDEX IF NOT EXISTS idx_game_library_created_at ON game_library(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_library_rating ON game_library(user_id, personal_rating DESC) WHERE personal_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_library_external_id ON game_library(external_id);

-- Enable Row Level Security
ALTER TABLE game_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own game library
CREATE POLICY "Users can view own game library"
  ON game_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game library items"
  ON game_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game library items"
  ON game_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game library items"
  ON game_library FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE game_library IS 'Personal game library for tracking games to play and completed games';
COMMENT ON COLUMN game_library.external_id IS 'RAWG API game ID';
COMMENT ON COLUMN game_library.slug IS 'URL-friendly game identifier from RAWG';
COMMENT ON COLUMN game_library.played IS 'False = playing/backlog, True = played/completed';
COMMENT ON COLUMN game_library.platforms IS 'Comma-separated list of platform names';
COMMENT ON COLUMN game_library.genres IS 'Comma-separated list of genre names';
COMMENT ON COLUMN game_library.rating IS 'RAWG community rating (0.00-5.00)';
COMMENT ON COLUMN game_library.metacritic IS 'Metacritic score (0-100)';
COMMENT ON COLUMN game_library.playtime IS 'Average playtime in hours';

-- Function to automatically update played_at when played status changes to true
CREATE OR REPLACE FUNCTION update_game_library_played_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If played is being set to true and played_at is not already set
  IF NEW.played = true AND OLD.played = false AND NEW.played_at IS NULL THEN
    NEW.played_at = NOW();
  END IF;
  
  -- If played is being set back to false, clear played_at
  IF NEW.played = false AND OLD.played = true THEN
    NEW.played_at = NULL;
  END IF;
  
  -- Always update updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_game_library_played_at
  BEFORE UPDATE ON game_library
  FOR EACH ROW
  EXECUTE FUNCTION update_game_library_played_at();
