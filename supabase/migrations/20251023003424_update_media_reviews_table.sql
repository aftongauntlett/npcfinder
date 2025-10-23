-- Update media_reviews table to support 1-10 rating and track edits
-- This migration updates the existing table structure

-- 1. Update rating constraint to allow 1-10 instead of 1-5
ALTER TABLE media_reviews 
DROP CONSTRAINT IF EXISTS media_reviews_rating_check;

ALTER TABLE media_reviews 
ADD CONSTRAINT media_reviews_rating_check CHECK (rating >= 1 AND rating <= 10);

-- 2. Add columns for tracking edits
ALTER TABLE media_reviews 
ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 3. Add title field to cache media title
ALTER TABLE media_reviews 
ADD COLUMN IF NOT EXISTS title text;

-- 4. Create trigger to automatically set is_edited and edited_at on updates
CREATE OR REPLACE FUNCTION update_media_review_edited()
RETURNS TRIGGER AS $$
BEGIN
  -- Only mark as edited if review_text, rating, or liked changed
  IF (OLD.review_text IS DISTINCT FROM NEW.review_text) OR
     (OLD.rating IS DISTINCT FROM NEW.rating) OR
     (OLD.liked IS DISTINCT FROM NEW.liked) THEN
    NEW.is_edited := true;
    NEW.edited_at := now();
  END IF;
  
  -- Always update updated_at
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_media_review_edited ON media_reviews;
CREATE TRIGGER set_media_review_edited
  BEFORE UPDATE ON media_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_media_review_edited();

-- 5. Add index for querying friends' public reviews
CREATE INDEX IF NOT EXISTS idx_media_reviews_external_id_public 
ON media_reviews(external_id, media_type, is_public) 
WHERE is_public = true;

-- 6. Add comment
COMMENT ON TABLE media_reviews IS 'Personal media reviews with 1-10 ratings, like/dislike reactions, and privacy controls. Tracks edit history.';
COMMENT ON COLUMN media_reviews.rating IS '1-10 star rating (optional)';
COMMENT ON COLUMN media_reviews.is_edited IS 'True if review has been edited after initial creation';
COMMENT ON COLUMN media_reviews.edited_at IS 'Timestamp of last edit (only for content changes, not privacy/visibility)';
