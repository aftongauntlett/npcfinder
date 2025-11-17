-- Add categories column to reading_list table
-- Categories from Google Books API (stored as comma-separated string)

ALTER TABLE reading_list
ADD COLUMN IF NOT EXISTS categories TEXT;

-- Add index for category filtering (using GIN for text search)
CREATE INDEX IF NOT EXISTS idx_reading_list_categories 
ON reading_list USING gin(to_tsvector('english', categories));

-- Add comment
COMMENT ON COLUMN reading_list.categories IS 'Comma-separated book categories from Google Books API (e.g., "Fiction, Fantasy, Adventure")';
