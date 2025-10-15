-- Drop the old collection-based user_music table
DROP TABLE IF EXISTS user_music CASCADE;

-- Create music_recommendations table for friend-to-friend music sharing
CREATE TABLE IF NOT EXISTS music_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who's involved
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Song details (from iTunes API)
  external_id TEXT NOT NULL, -- iTunes track/album ID
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  media_type TEXT CHECK (media_type IN ('track', 'album')),
  year INTEGER,
  poster_url TEXT,
  genre TEXT,
  
  -- Recommendation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'listened', 'hit', 'miss')),
  sent_message TEXT, -- Optional note when sending
  comment TEXT, -- Optional comment after listening
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  listened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate recommendations of same song from same person
  UNIQUE(from_user_id, to_user_id, external_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_music_recs_to_user ON music_recommendations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_music_recs_from_user ON music_recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_music_recs_to_from ON music_recommendations(to_user_id, from_user_id);
CREATE INDEX IF NOT EXISTS idx_music_recs_status ON music_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_music_recs_sent_at ON music_recommendations(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE music_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can see recommendations they sent or received
CREATE POLICY "Users can view recommendations they sent"
  ON music_recommendations FOR SELECT
  USING (auth.uid() = from_user_id);

CREATE POLICY "Users can view recommendations they received"
  ON music_recommendations FOR SELECT
  USING (auth.uid() = to_user_id);

-- Users can send recommendations
CREATE POLICY "Users can send recommendations"
  ON music_recommendations FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Users can update recommendations they received (mark as listened/hit/miss, add comment)
CREATE POLICY "Users can update recommendations they received"
  ON music_recommendations FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Users can delete recommendations they sent (before they're listened to)
CREATE POLICY "Users can delete their sent recommendations"
  ON music_recommendations FOR DELETE
  USING (auth.uid() = from_user_id AND status = 'pending');

-- Add updated_at trigger
CREATE TRIGGER update_music_recommendations_updated_at
  BEFORE UPDATE ON music_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy stats querying
CREATE OR REPLACE VIEW music_recommendation_stats AS
SELECT 
  to_user_id,
  from_user_id,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'listened') as listened_count,
  COUNT(*) FILTER (WHERE status = 'hit') as hit_count,
  COUNT(*) FILTER (WHERE status = 'miss') as miss_count,
  COUNT(*) as total_count,
  MAX(sent_at) as last_sent_at
FROM music_recommendations
GROUP BY to_user_id, from_user_id;

-- Grant access to the view
GRANT SELECT ON music_recommendation_stats TO authenticated;
