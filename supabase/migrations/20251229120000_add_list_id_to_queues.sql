-- Add list_id to queue tables to associate items with categories
-- This enables organizing media items into user-defined categories/lists

-- Add list_id to user_watchlist table
ALTER TABLE user_watchlist
ADD COLUMN list_id UUID REFERENCES media_lists(id) ON DELETE SET NULL;

-- Add list_id to reading_list table
ALTER TABLE reading_list
ADD COLUMN list_id UUID REFERENCES media_lists(id) ON DELETE SET NULL;

-- Add list_id to game_library table
ALTER TABLE game_library
ADD COLUMN list_id UUID REFERENCES media_lists(id) ON DELETE SET NULL;

-- Add list_id to music_library table
ALTER TABLE music_library
ADD COLUMN list_id UUID REFERENCES media_lists(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_user_watchlist_list_id ON user_watchlist(list_id);
CREATE INDEX idx_reading_list_list_id ON reading_list(list_id);
CREATE INDEX idx_game_library_list_id ON game_library(list_id);
CREATE INDEX idx_music_library_list_id ON music_library(list_id);

-- Note: Domain validation is handled in the application layer
-- The foreign key constraints ensure list_id references a valid media_lists record