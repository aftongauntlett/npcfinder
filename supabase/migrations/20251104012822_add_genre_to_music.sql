-- Add genre column to music_library table
-- Stores primary genre from iTunes API (e.g., "Pop", "Rock", "Country", "Classical")

ALTER TABLE music_library
ADD COLUMN IF NOT EXISTS genre text;

COMMENT ON COLUMN music_library.genre IS 'Primary genre from iTunes API (e.g., Pop, Rock, Country)';
