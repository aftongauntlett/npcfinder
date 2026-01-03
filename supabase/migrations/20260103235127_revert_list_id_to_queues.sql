-- Revert: remove list_id columns and related indexes from queue tables
--
-- This reverses migration: 20251229120000_add_list_id_to_queues.sql

-- Drop indexes first (some Postgres setups require this before dropping the column)
DROP INDEX IF EXISTS idx_user_watchlist_list_id;
DROP INDEX IF EXISTS idx_reading_list_list_id;
DROP INDEX IF EXISTS idx_game_library_list_id;
DROP INDEX IF EXISTS idx_music_library_list_id;

-- Drop columns
ALTER TABLE IF EXISTS user_watchlist DROP COLUMN IF EXISTS list_id;
ALTER TABLE IF EXISTS reading_list DROP COLUMN IF EXISTS list_id;
ALTER TABLE IF EXISTS game_library DROP COLUMN IF EXISTS list_id;
ALTER TABLE IF EXISTS music_library DROP COLUMN IF EXISTS list_id;
