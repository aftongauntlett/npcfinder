-- Allow 10-star ratings for tracker items (previously capped at 5).
ALTER TABLE public.tracker_items
DROP CONSTRAINT IF EXISTS tracker_items_rating_check;

ALTER TABLE public.tracker_items
ADD CONSTRAINT tracker_items_rating_check
CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10));
