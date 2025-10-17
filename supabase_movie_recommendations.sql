-- Movie & TV Recommendations Table Schema
-- For tracking movie and TV show recommendations between users

-- Create the movie_recommendations table
CREATE TABLE IF NOT EXISTS movie_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User relationships
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Media information (from external API like TMDB)
  external_id TEXT NOT NULL, -- TMDB movie/TV ID
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  release_date TEXT,
  overview TEXT, -- Movie/show description
  poster_url TEXT, -- Movie poster/TV show artwork
  year INTEGER, -- Release year for easier sorting/filtering
  
  -- Recommendation metadata
  recommendation_type TEXT NOT NULL DEFAULT 'watch' CHECK (recommendation_type IN ('watch', 'rewatch')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'watched', 'hit', 'miss')),
  
  -- User notes/comments
  sent_message TEXT, -- Message from sender when recommending
  sender_note TEXT, -- Sender's personal note (private to sender)
  recipient_note TEXT, -- Recipient's note after watching
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  watched_at TIMESTAMP WITH TIME ZONE, -- When recipient marked as watched/hit/miss
  opened_at TIMESTAMP WITH TIME ZONE, -- When recipient first viewed the recommendation
  
  -- Constraints
  CHECK (from_user_id != to_user_id) -- Can't send recommendation to yourself
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_movie_recs_to_user ON movie_recommendations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_movie_recs_from_user ON movie_recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_movie_recs_created_at ON movie_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movie_recs_status ON movie_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_movie_recs_media_type ON movie_recommendations(media_type);
CREATE INDEX IF NOT EXISTS idx_movie_recs_year ON movie_recommendations(year);

-- Enable Row Level Security
ALTER TABLE movie_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view recommendations they sent
CREATE POLICY "Users can view recommendations they sent"
  ON movie_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Policy 2: Users can view recommendations sent to them
CREATE POLICY "Users can view recommendations sent to them"
  ON movie_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Policy 3: Users can insert recommendations (send to others)
CREATE POLICY "Users can send recommendations"
  ON movie_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 4: Recipients can update status/notes on recommendations sent to them
CREATE POLICY "Recipients can update their recommendations"
  ON movie_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Policy 5: Senders can update sender_note on recommendations they sent
CREATE POLICY "Senders can update their notes"
  ON movie_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 6: Senders can delete recommendations they sent (unsend)
CREATE POLICY "Senders can delete recommendations they sent"
  ON movie_recommendations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Function to automatically update watched_at when status changes
CREATE OR REPLACE FUNCTION update_movie_rec_watched_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed from 'pending' to watched/hit/miss, set watched_at
  IF OLD.status = 'pending' AND NEW.status IN ('watched', 'hit', 'miss') THEN
    NEW.watched_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER update_movie_rec_watched_at_trigger
  BEFORE UPDATE ON movie_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_rec_watched_at();

-- Optional: Create a view that joins with user profiles for display
CREATE OR REPLACE VIEW movie_recommendations_with_users AS
SELECT 
  mr.*,
  from_profile.display_name as sender_name,
  to_profile.display_name as recipient_name
FROM movie_recommendations mr
LEFT JOIN user_profiles from_profile ON mr.from_user_id = from_profile.user_id
LEFT JOIN user_profiles to_profile ON mr.to_user_id = to_profile.user_id;
