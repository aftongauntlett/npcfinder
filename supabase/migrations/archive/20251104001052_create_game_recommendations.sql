-- Game Recommendations Table Schema
-- For tracking game recommendations between users
-- Field names match RAWG API for consistency

-- Create the game_recommendations table
CREATE TABLE IF NOT EXISTS game_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User relationships
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Game information (from RAWG API)
  external_id TEXT NOT NULL, -- RAWG game ID
  slug TEXT NOT NULL, -- URL-friendly game identifier
  name TEXT NOT NULL, -- Game title
  released TEXT, -- Release date (YYYY-MM-DD format)
  background_image TEXT, -- Main game image URL
  platforms TEXT, -- Comma-separated platform names
  genres TEXT, -- Comma-separated genre names
  rating NUMERIC(3,2), -- RAWG rating (0.00-5.00)
  metacritic INTEGER, -- Metacritic score (0-100)
  playtime INTEGER, -- Average playtime in hours
  
  -- Recommendation metadata
  recommendation_type TEXT NOT NULL DEFAULT 'play' CHECK (recommendation_type IN ('play', 'replay')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'played', 'hit', 'miss')),
  
  -- User notes/comments
  sent_message TEXT, -- Message from sender when recommending
  sender_note TEXT, -- Sender's personal note (private to sender)
  recipient_note TEXT, -- Recipient's note after playing
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  played_at TIMESTAMP WITH TIME ZONE, -- When recipient marked as played/hit/miss
  opened_at TIMESTAMP WITH TIME ZONE, -- When recipient first viewed the recommendation
  
  -- Constraints
  CHECK (from_user_id != to_user_id) -- Can't send recommendation to yourself
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_recs_to_user ON game_recommendations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_game_recs_from_user ON game_recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_game_recs_created_at ON game_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_recs_status ON game_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_game_recs_external_id ON game_recommendations(external_id);
CREATE INDEX IF NOT EXISTS idx_game_recs_name ON game_recommendations USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_game_recs_platforms ON game_recommendations USING gin(to_tsvector('english', platforms));
CREATE INDEX IF NOT EXISTS idx_game_recs_genres ON game_recommendations USING gin(to_tsvector('english', genres));

-- Enable Row Level Security
ALTER TABLE game_recommendations ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON game_recommendations TO authenticated;

-- Policy 1: Users can view recommendations they sent
CREATE POLICY "Users can view game recommendations they sent"
  ON game_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Policy 2: Users can view recommendations sent to them
CREATE POLICY "Users can view game recommendations sent to them"
  ON game_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Policy 3: Users can insert recommendations (send to others)
CREATE POLICY "Users can send game recommendations"
  ON game_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 4: Recipients can update status/notes on recommendations sent to them
CREATE POLICY "Recipients can update their game recommendations"
  ON game_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Policy 5: Senders can update sender_note on recommendations they sent
CREATE POLICY "Senders can update their game notes"
  ON game_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 6: Senders can delete recommendations they sent (unsend)
CREATE POLICY "Senders can delete game recommendations they sent"
  ON game_recommendations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Function to automatically update played_at when status changes
CREATE OR REPLACE FUNCTION update_game_recommendation_played_at()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to played/hit/miss, set played_at if not already set
  IF NEW.status IN ('played', 'hit', 'miss') 
     AND OLD.status = 'pending' 
     AND NEW.played_at IS NULL THEN
    NEW.played_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for played_at timestamp
CREATE TRIGGER trigger_update_game_recommendation_played_at
  BEFORE UPDATE ON game_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_game_recommendation_played_at();

-- Add table and column comments for documentation
COMMENT ON TABLE game_recommendations IS 'Game recommendations between users with tracking of play status and ratings';
COMMENT ON COLUMN game_recommendations.external_id IS 'RAWG API game ID';
COMMENT ON COLUMN game_recommendations.slug IS 'URL-friendly game identifier from RAWG';
COMMENT ON COLUMN game_recommendations.recommendation_type IS 'Type: play (first time) or replay (play again)';
COMMENT ON COLUMN game_recommendations.status IS 'Tracking status: pending, played, hit (loved it), miss (did not like)';
COMMENT ON COLUMN game_recommendations.platforms IS 'Comma-separated list of platform names';
COMMENT ON COLUMN game_recommendations.genres IS 'Comma-separated list of genre names';
COMMENT ON COLUMN game_recommendations.rating IS 'RAWG community rating (0.00-5.00)';
COMMENT ON COLUMN game_recommendations.metacritic IS 'Metacritic score (0-100)';
COMMENT ON COLUMN game_recommendations.playtime IS 'Average playtime in hours';
