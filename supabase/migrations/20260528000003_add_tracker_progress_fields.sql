-- Add progress-tracking fields for TV and books.
ALTER TABLE public.tracker_items
ADD COLUMN IF NOT EXISTS tv_current_season integer,
ADD COLUMN IF NOT EXISTS tv_current_episode integer,
ADD COLUMN IF NOT EXISTS book_current_page integer,
ADD COLUMN IF NOT EXISTS book_chapter_notes jsonb;

UPDATE public.tracker_items
SET book_chapter_notes = '[]'::jsonb
WHERE book_chapter_notes IS NULL;

ALTER TABLE public.tracker_items
ALTER COLUMN book_chapter_notes SET DEFAULT '[]'::jsonb;

ALTER TABLE public.tracker_items
DROP CONSTRAINT IF EXISTS tracker_items_tv_current_season_check;

ALTER TABLE public.tracker_items
ADD CONSTRAINT tracker_items_tv_current_season_check
CHECK (tv_current_season IS NULL OR tv_current_season >= 1);

ALTER TABLE public.tracker_items
DROP CONSTRAINT IF EXISTS tracker_items_tv_current_episode_check;

ALTER TABLE public.tracker_items
ADD CONSTRAINT tracker_items_tv_current_episode_check
CHECK (tv_current_episode IS NULL OR tv_current_episode >= 1);

ALTER TABLE public.tracker_items
DROP CONSTRAINT IF EXISTS tracker_items_book_current_page_check;

ALTER TABLE public.tracker_items
ADD CONSTRAINT tracker_items_book_current_page_check
CHECK (book_current_page IS NULL OR book_current_page >= 1);

ALTER TABLE public.tracker_items
DROP CONSTRAINT IF EXISTS tracker_items_book_chapter_notes_array_check;

ALTER TABLE public.tracker_items
ADD CONSTRAINT tracker_items_book_chapter_notes_array_check
CHECK (
  book_chapter_notes IS NULL
  OR jsonb_typeof(book_chapter_notes) = 'array'
);
