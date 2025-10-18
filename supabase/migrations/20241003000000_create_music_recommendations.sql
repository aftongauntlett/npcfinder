-- Music Recommendations Table Schema
-- For tracking music recommendations between users (songs, albums, playlists)

-- Create the music_recommendations table
CREATE TABLE IF NOT EXISTS music_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User relationships
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Media information (from external API like Spotify/iTunes)
  external_id TEXT NOT NULL, -- Spotify track ID, iTunes ID, etc.
  media_type TEXT NOT NULL CHECK (media_type IN ('song', 'album', 'playlist')),
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  release_date TEXT,
  poster_url TEXT, -- Album/track artwork
  preview_url TEXT, -- Preview audio URL if available
  
  -- Recommendation metadata
  recommendation_type TEXT NOT NULL DEFAULT 'listen' CHECK (recommendation_type IN ('listen', 'watch', 'study')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed', 'hit', 'miss')),
  
  -- User notes/comments
  sent_message TEXT, -- Message from sender when recommending
  sender_note TEXT, -- Sender's personal note (private to sender)
  recipient_note TEXT, -- Recipient's note after consuming
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  consumed_at TIMESTAMP WITH TIME ZONE, -- When recipient marked as consumed/hit/miss
  opened_at TIMESTAMP WITH TIME ZONE, -- When recipient first viewed the recommendation
  
  -- Constraints
  CHECK (from_user_id != to_user_id) -- Can't send recommendation to yourself
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_music_recs_to_user ON music_recommendations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_music_recs_from_user ON music_recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_music_recs_created_at ON music_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_recs_status ON music_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_music_recs_media_type ON music_recommendations(media_type);

-- Enable Row Level Security
ALTER TABLE music_recommendations ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON music_recommendations TO authenticated;

-- Policy 1: Users can view recommendations they sent
CREATE POLICY "Users can view recommendations they sent"
  ON music_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Policy 2: Users can view recommendations sent to them
CREATE POLICY "Users can view recommendations sent to them"
  ON music_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Policy 3: Users can insert recommendations (send to others)
CREATE POLICY "Users can send recommendations"
  ON music_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 4: Recipients can update status/notes on recommendations sent to them
CREATE POLICY "Recipients can update their recommendations"
  ON music_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Policy 5: Senders can update sender_note on recommendations they sent
CREATE POLICY "Senders can update their notes"
  ON music_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 6: Senders can delete recommendations they sent (unsend)
CREATE POLICY "Senders can delete recommendations they sent"
  ON music_recommendations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Function to automatically update consumed_at when status changes
CREATE OR REPLACE FUNCTION update_music_rec_consumed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed from 'pending' to consumed/hit/miss, set consumed_at
  IF OLD.status = 'pending' AND NEW.status IN ('consumed', 'hit', 'miss') THEN
    NEW.consumed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER update_music_rec_consumed_at_trigger
  BEFORE UPDATE ON music_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_music_rec_consumed_at();

-- Optional: Create a view that joins with user profiles for display
CREATE OR REPLACE VIEW music_recommendations_with_users AS
SELECT 
  mr.*,
  from_profile.display_name as sender_name,
  to_profile.display_name as recipient_name
FROM music_recommendations mr
LEFT JOIN user_profiles from_profile ON mr.from_user_id = from_profile.user_id
LEFT JOIN user_profiles to_profile ON mr.to_user_id = to_profile.user_id;
