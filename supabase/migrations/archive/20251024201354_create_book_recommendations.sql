-- Book Recommendations Table Schema
-- For tracking book recommendations between users
-- Field names match Google Books API for consistency

-- Create the book_recommendations table
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User relationships
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Book information (from Google Books API)
  external_id TEXT NOT NULL, -- Google Books Volume ID
  title TEXT NOT NULL,
  authors TEXT, -- Comma-separated author names (plural to match API)
  thumbnail_url TEXT, -- Book cover image URL
  published_date TEXT, -- Publication date (can be partial: YYYY or YYYY-MM-DD)
  description TEXT, -- Book description/synopsis
  isbn TEXT, -- ISBN-13 or ISBN-10
  page_count INTEGER, -- Number of pages
  
  -- Recommendation metadata
  recommendation_type TEXT NOT NULL DEFAULT 'read' CHECK (recommendation_type IN ('read', 'reread')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'hit', 'miss')),
  
  -- User notes/comments
  sent_message TEXT, -- Message from sender when recommending
  sender_note TEXT, -- Sender's personal note (private to sender)
  recipient_note TEXT, -- Recipient's note after reading
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE, -- When recipient marked as read/hit/miss
  opened_at TIMESTAMP WITH TIME ZONE, -- When recipient first viewed the recommendation
  
  -- Constraints
  CHECK (from_user_id != to_user_id) -- Can't send recommendation to yourself
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_recs_to_user ON book_recommendations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_book_recs_from_user ON book_recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_book_recs_created_at ON book_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_recs_status ON book_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_book_recs_external_id ON book_recommendations(external_id);
CREATE INDEX IF NOT EXISTS idx_book_recs_authors ON book_recommendations USING gin(to_tsvector('english', authors));
CREATE INDEX IF NOT EXISTS idx_book_recs_title ON book_recommendations USING gin(to_tsvector('english', title));

-- Enable Row Level Security
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON book_recommendations TO authenticated;

-- Policy 1: Users can view recommendations they sent
CREATE POLICY "Users can view book recommendations they sent"
  ON book_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Policy 2: Users can view recommendations sent to them
CREATE POLICY "Users can view book recommendations sent to them"
  ON book_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Policy 3: Users can insert recommendations (send to others)
CREATE POLICY "Users can send book recommendations"
  ON book_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 4: Recipients can update status/notes on recommendations sent to them
CREATE POLICY "Recipients can update their book recommendations"
  ON book_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Policy 5: Senders can update sender_note on recommendations they sent
CREATE POLICY "Senders can update their book notes"
  ON book_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

-- Policy 6: Senders can delete recommendations they sent (unsend)
CREATE POLICY "Senders can delete book recommendations they sent"
  ON book_recommendations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Function to automatically update read_at when status changes
CREATE OR REPLACE FUNCTION update_book_rec_read_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed from 'pending' to read/hit/miss, set read_at
  IF OLD.status = 'pending' AND NEW.status IN ('read', 'hit', 'miss') THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER update_book_rec_read_at_trigger
  BEFORE UPDATE ON book_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_book_rec_read_at();

-- Create a view that joins with user profiles for display
CREATE OR REPLACE VIEW book_recommendations_with_users AS
SELECT 
  br.*,
  from_profile.display_name as sender_name,
  to_profile.display_name as recipient_name
FROM book_recommendations br
LEFT JOIN user_profiles from_profile ON br.from_user_id = from_profile.user_id
LEFT JOIN user_profiles to_profile ON br.to_user_id = to_profile.user_id;

-- Grant SELECT on view to authenticated users
GRANT SELECT ON book_recommendations_with_users TO authenticated;

-- Comments for documentation
COMMENT ON TABLE book_recommendations IS 'Book recommendations between users';
COMMENT ON COLUMN book_recommendations.external_id IS 'Google Books Volume ID';
COMMENT ON COLUMN book_recommendations.authors IS 'Comma-separated list of author names (plural to match Google Books API)';
COMMENT ON COLUMN book_recommendations.recommendation_type IS 'Whether suggesting to read or reread';
COMMENT ON COLUMN book_recommendations.status IS 'Recipient status: pending, read, hit (loved it), or miss (did not enjoy)';
COMMENT ON COLUMN book_recommendations.sent_message IS 'Optional message from sender when recommending';
COMMENT ON COLUMN book_recommendations.sender_note IS 'Private note for sender only';
COMMENT ON COLUMN book_recommendations.recipient_note IS 'Recipient notes/review after reading';
COMMENT ON COLUMN book_recommendations.read_at IS 'Timestamp when recipient marked as read/hit/miss';
COMMENT ON COLUMN book_recommendations.opened_at IS 'Timestamp when recipient first opened the recommendation';
