-- Reading List Table Schema
-- Personal reading list for books users want to read or have read
-- Field names match Google Books API for consistency

-- Drop existing table if it exists (to ensure clean migration)
DROP TABLE IF EXISTS reading_list CASCADE;

-- Create the reading_list table
CREATE TABLE reading_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Book information (from Google Books API)
  external_id TEXT NOT NULL, -- Google Books Volume ID
  title TEXT NOT NULL,
  authors TEXT, -- Comma-separated author names (plural to match API)
  thumbnail_url TEXT, -- Book cover image URL
  published_date TEXT, -- Publication date (can be partial: YYYY or YYYY-MM-DD)
  description TEXT, -- Book description/synopsis
  isbn TEXT, -- ISBN-13 or ISBN-10
  page_count INTEGER, -- Number of pages
  
  -- Reading status
  read BOOLEAN DEFAULT false, -- Whether user has read this book
  
  -- User notes and ratings
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5), -- 1-5 stars
  personal_notes TEXT, -- User's private notes/review
  
  -- Timestamps
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE, -- When marked as read
  
  -- Ensure user can't add same book twice
  UNIQUE(user_id, external_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_list_user_id ON reading_list(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_user_read ON reading_list(user_id, read);
CREATE INDEX IF NOT EXISTS idx_reading_list_added_at ON reading_list(user_id, added_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_list_external_id ON reading_list(external_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_authors ON reading_list USING gin(to_tsvector('english', authors));
CREATE INDEX IF NOT EXISTS idx_reading_list_title ON reading_list USING gin(to_tsvector('english', title));

-- Enable Row Level Security
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON reading_list TO authenticated;

-- Policy 1: Users can view their own reading list
CREATE POLICY "Users can view their own reading list"
  ON reading_list
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can add to their own reading list
CREATE POLICY "Users can add to their own reading list"
  ON reading_list
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own reading list items
CREATE POLICY "Users can update their own reading list"
  ON reading_list
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete from their own reading list
CREATE POLICY "Users can delete from their own reading list"
  ON reading_list
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp and manage read_at
CREATE OR REPLACE FUNCTION update_reading_list_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Only update read_at if this is an UPDATE operation (not INSERT)
  IF TG_OP = 'UPDATE' THEN
    -- Set read_at when read status changes to true
    IF NEW.read = true AND OLD.read = false THEN
      NEW.read_at = NOW();
    END IF;
    
    -- Clear read_at when read status changes to false
    IF NEW.read = false AND OLD.read = true THEN
      NEW.read_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps before updates
CREATE TRIGGER update_reading_list_timestamps_trigger
  BEFORE UPDATE ON reading_list
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_list_timestamps();

-- Comments for documentation
COMMENT ON TABLE reading_list IS 'Personal reading list for books users want to read or have read';
COMMENT ON COLUMN reading_list.external_id IS 'Google Books Volume ID';
COMMENT ON COLUMN reading_list.authors IS 'Comma-separated list of author names (plural to match Google Books API)';
COMMENT ON COLUMN reading_list.read IS 'Whether the user has read this book';
COMMENT ON COLUMN reading_list.personal_rating IS 'User rating from 1-5 stars';
COMMENT ON COLUMN reading_list.read_at IS 'Timestamp when book was marked as read';
