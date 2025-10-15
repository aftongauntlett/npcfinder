-- Add recommendation_type field to music_recommendations
-- Allows sender to suggest "listen" vs "watch" (for music videos)

ALTER TABLE music_recommendations
ADD COLUMN recommendation_type TEXT CHECK (recommendation_type IN ('listen', 'watch')) DEFAULT 'listen';

COMMENT ON COLUMN music_recommendations.recommendation_type IS 'Whether to suggest listening to the audio or watching the video';
