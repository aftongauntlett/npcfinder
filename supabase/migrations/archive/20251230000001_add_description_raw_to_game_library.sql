-- Add description_raw column to game_library table
-- This field stores the raw description HTML from RAWG API

ALTER TABLE game_library
ADD COLUMN IF NOT EXISTS description_raw text;

COMMENT ON COLUMN game_library.description_raw IS 'Game description from RAWG API (raw HTML)';
