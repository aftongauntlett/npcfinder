-- Add custom_order column to media tables for drag-to-reorder functionality
-- Similar to tasks system, allows users to manually sort their lists

-- Add custom_order to user_watchlist
ALTER TABLE public.user_watchlist
ADD COLUMN custom_order integer DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_watchlist_custom_order
ON public.user_watchlist (user_id, custom_order);

-- Add custom_order to reading_list
ALTER TABLE public.reading_list
ADD COLUMN custom_order integer DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reading_list_custom_order
ON public.reading_list (user_id, custom_order);

-- Add custom_order to game_library
ALTER TABLE public.game_library
ADD COLUMN custom_order integer DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_game_library_custom_order
ON public.game_library (user_id, custom_order);

-- Add custom_order to music_library
ALTER TABLE public.music_library
ADD COLUMN custom_order integer DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_music_library_custom_order
ON public.music_library (user_id, custom_order);

COMMENT ON COLUMN public.user_watchlist.custom_order IS 'Custom sort order for drag-to-reorder functionality';
COMMENT ON COLUMN public.reading_list.custom_order IS 'Custom sort order for drag-to-reorder functionality';
COMMENT ON COLUMN public.game_library.custom_order IS 'Custom sort order for drag-to-reorder functionality';
COMMENT ON COLUMN public.music_library.custom_order IS 'Custom sort order for drag-to-reorder functionality';
