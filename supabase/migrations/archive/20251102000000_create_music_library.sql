-- Create music_library table for personal music tracking
-- Matches the pattern of reading_list and watchlist tables
-- Supports songs and albums from iTunes/Spotify APIs
-- Fields align with music_recommendations table for consistency

CREATE TABLE IF NOT EXISTS music_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Media information (matches music_recommendations structure)
  external_id text NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  album text,
  media_type text NOT NULL CHECK (media_type IN ('song', 'album', 'playlist')),
  release_date text, -- Using text to match music_recommendations (can store YYYY-MM-DD or YYYY)
  album_cover_url text, -- Album artwork URL (poster_url in recommendations)
  preview_url text, -- Preview audio URL if available
  
  -- Personal tracking
  listened boolean DEFAULT false, -- false = listening/queue, true = listened/completed
  personal_rating integer CHECK (personal_rating >= 1 AND personal_rating <= 5),
  personal_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  listened_at timestamptz, -- When marked as listened
  
  -- Prevent duplicate entries for same user
  UNIQUE(user_id, external_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_music_library_user_id ON music_library(user_id);
CREATE INDEX IF NOT EXISTS idx_music_library_listened ON music_library(user_id, listened);
CREATE INDEX IF NOT EXISTS idx_music_library_created_at ON music_library(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE music_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own music library
CREATE POLICY "Users can view own music library"
  ON music_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own music library items"
  ON music_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own music library items"
  ON music_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own music library items"
  ON music_library FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE music_library IS 'Personal music library for tracking songs and albums';
COMMENT ON COLUMN music_library.media_type IS 'Type of media: song, album, or playlist';
COMMENT ON COLUMN music_library.listened IS 'False = listening/queue, True = listened/completed';
COMMENT ON COLUMN music_library.release_date IS 'Release date in text format (YYYY-MM-DD or YYYY) to match music_recommendations';

-- Function to automatically update listened_at when listened status changes to true
CREATE OR REPLACE FUNCTION update_music_library_listened_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If listened is being set to true and listened_at is not already set
  IF NEW.listened = true AND OLD.listened = false AND NEW.listened_at IS NULL THEN
    NEW.listened_at = NOW();
  END IF;
  
  -- If listened is being set back to false, clear listened_at
  IF NEW.listened = false AND OLD.listened = true THEN
    NEW.listened_at = NULL;
  END IF;
  
  -- Always update updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_music_library_listened_at
  BEFORE UPDATE ON music_library
  FOR EACH ROW
  EXECUTE FUNCTION update_music_library_listened_at();
