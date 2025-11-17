-- Update book_recommendations recommendation_type constraint
-- Remove 'reread' (re-consumption should be indicated via message/note, not type)
-- Add 'listen' for audiobook recommendations
-- This aligns with other media types where recommendation_type indicates consumption method

-- Drop the existing constraint
ALTER TABLE book_recommendations
DROP CONSTRAINT IF EXISTS book_recommendations_recommendation_type_check;

-- Add the new constraint with only consumption methods: 'read' and 'listen'
ALTER TABLE book_recommendations
ADD CONSTRAINT book_recommendations_recommendation_type_check
CHECK (recommendation_type IN ('read', 'listen'));
