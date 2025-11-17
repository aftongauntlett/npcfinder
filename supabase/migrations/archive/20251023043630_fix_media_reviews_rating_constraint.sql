-- Fix media_reviews rating constraint to be 1-5 (not 1-10)
-- The previous migration incorrectly set it to 1-10, but our frontend uses a 5-star system
-- This corrective migration reverts to the correct 1-5 range
-- Also updates trigger to remove 'liked' from edit tracking (feature removed from UI)

-- First, migrate any existing data that has ratings > 5
-- Scale down 6-10 ratings to 1-5 scale (divide by 2 and round)
UPDATE media_reviews 
SET rating = LEAST(5, GREATEST(1, ROUND(rating / 2.0)))
WHERE rating > 5;

-- Drop the incorrect 1-10 constraint
ALTER TABLE media_reviews 
DROP CONSTRAINT IF EXISTS media_reviews_rating_check;

-- Add correct 1-5 constraint (matching frontend 5-star system)
ALTER TABLE media_reviews 
ADD CONSTRAINT media_reviews_rating_check CHECK (rating >= 1 AND rating <= 5);

-- Update trigger to stop tracking 'liked' in edit detection (feature deprecated)
CREATE OR REPLACE FUNCTION update_media_review_edited()
RETURNS TRIGGER AS $$
BEGIN
  -- Only mark as edited if review_text or rating changed (removed liked)
  IF (OLD.review_text IS DISTINCT FROM NEW.review_text) OR
     (OLD.rating IS DISTINCT FROM NEW.rating) THEN
    NEW.is_edited := true;
    NEW.edited_at := now();
  END IF;
  
  -- Always update updated_at
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comments to clarify
COMMENT ON COLUMN media_reviews.rating IS '1-5 star rating (matching frontend 5-star system)';
COMMENT ON COLUMN media_reviews.liked IS 'DEPRECATED: Thumbs up/down feature removed from UI. Column kept for data preservation.';
