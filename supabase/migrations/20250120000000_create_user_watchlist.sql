-- User Watchlist Table Schema
-- Personal "to-watch" list for movies and TV shows

-- Drop existing table if it exists (to ensure clean migration)
DROP TABLE IF EXISTS user_watchlist CASCADE;

-- Create the user_watchlist table
CREATE TABLE user_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Media information (from TMDB API)
  external_id TEXT NOT NULL, -- TMDB movie/TV ID
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_url TEXT,
  release_date TEXT, -- YYYY or YYYY-MM-DD format from TMDB
  overview TEXT, -- Description
  
  -- Enhanced metadata (optional, from TMDB details)
  director TEXT,
  cast_members TEXT[], -- Array of actor names (cast is reserved keyword)
  genres TEXT[], -- Array of genre names
  vote_average DECIMAL(3,1), -- TMDB rating 0.0-10.0
  vote_count INTEGER,
  runtime INTEGER, -- Minutes
  
  -- Watchlist features
  watched BOOLEAN DEFAULT false, -- Toggle watched status
  list_order INTEGER, -- For future drag-drop ordering
  notes TEXT, -- User's personal notes
  
  -- Timestamps
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  watched_at TIMESTAMP WITH TIME ZONE, -- When marked as watched
  
  -- Ensure user can't add same movie/show twice
  UNIQUE(user_id, external_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_watched ON user_watchlist(user_id, watched);
CREATE INDEX IF NOT EXISTS idx_watchlist_added_at ON user_watchlist(user_id, added_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_media_type ON user_watchlist(media_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_external_id ON user_watchlist(external_id);

-- Enable Row Level Security
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_watchlist TO authenticated;

-- Policy 1: Users can view their own watchlist
CREATE POLICY "Users can view their own watchlist"
  ON user_watchlist
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can add to their own watchlist
CREATE POLICY "Users can add to their own watchlist"
  ON user_watchlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own watchlist items
CREATE POLICY "Users can update their own watchlist"
  ON user_watchlist
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete from their own watchlist
CREATE POLICY "Users can delete from their own watchlist"
  ON user_watchlist
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watchlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Only update watched_at if this is an UPDATE operation (not INSERT)
  IF TG_OP = 'UPDATE' THEN
    -- Set watched_at when watched status changes to true
    IF NEW.watched = true AND OLD.watched = false THEN
      NEW.watched_at = NOW();
    END IF;
    
    -- Clear watched_at when watched status changes to false
    IF NEW.watched = false AND OLD.watched = true THEN
      NEW.watched_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at before updates
CREATE TRIGGER update_watchlist_updated_at_trigger
  BEFORE UPDATE ON user_watchlist
  FOR EACH ROW
  EXECUTE FUNCTION update_watchlist_updated_at();

-- Optional: Create index for future public watchlist feature
-- CREATE INDEX IF NOT EXISTS idx_watchlist_public ON user_watchlist(user_id) WHERE is_public = true;

-- Comments for documentation
COMMENT ON TABLE user_watchlist IS 'Personal watchlist for movies and TV shows users want to watch';
COMMENT ON COLUMN user_watchlist.external_id IS 'TMDB movie or TV show ID';
COMMENT ON COLUMN user_watchlist.watched IS 'Whether the user has watched this item';
COMMENT ON COLUMN user_watchlist.list_order IS 'Order in list for drag-drop (future feature)';
