-- DESTRUCTIVE MIGRATION
-- Migration: Remove legacy tasks/recommendations/collections schema
--
-- This migration permanently drops legacy feature tables, views, and helper functions
-- that are replaced by tracker_items + playlists + playlist_items + playlist_shares.
--
-- Dropped product surfaces:
-- - Recommendations system
-- - Tasks/Kanban/Recipes system
-- - Legacy collections + member role model
-- - Legacy personal libraries (watchlist, reading list, game library, music library)
--
-- NOTE: This migration is intentionally destructive. Ensure the previous migration
-- has successfully backfilled data into tracker/playlists tables before applying.

-- Recommendation views
DROP VIEW IF EXISTS public.movie_recommendations_with_users CASCADE;
DROP VIEW IF EXISTS public.music_recommendations_with_users CASCADE;
DROP VIEW IF EXISTS public.book_recommendations_with_users CASCADE;
DROP VIEW IF EXISTS public.game_recommendations_with_users CASCADE;

-- Recommendation tables
DROP TABLE IF EXISTS public.movie_recommendations CASCADE;
DROP TABLE IF EXISTS public.music_recommendations CASCADE;
DROP TABLE IF EXISTS public.book_recommendations CASCADE;
DROP TABLE IF EXISTS public.game_recommendations CASCADE;

-- Legacy personal media tables replaced by tracker_items
DROP TABLE IF EXISTS public.user_watchlist CASCADE;
DROP TABLE IF EXISTS public.user_watched_archive CASCADE;
DROP TABLE IF EXISTS public.reading_list CASCADE;
DROP TABLE IF EXISTS public.game_library CASCADE;
DROP TABLE IF EXISTS public.music_library CASCADE;

-- Legacy task system tables/views
DROP VIEW IF EXISTS public.task_boards_with_stats CASCADE;
DROP TABLE IF EXISTS public.task_board_members CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_board_sections CASCADE;
DROP TABLE IF EXISTS public.task_boards CASCADE;
DROP TABLE IF EXISTS public.board_shares CASCADE;

-- Legacy collections model replaced by playlists
DROP VIEW IF EXISTS public.media_lists_with_counts CASCADE;
DROP TABLE IF EXISTS public.media_list_members CASCADE;
DROP TABLE IF EXISTS public.media_list_items CASCADE;
DROP TABLE IF EXISTS public.media_lists CASCADE;

-- Legacy helper functions related to removed features
DROP FUNCTION IF EXISTS public.can_view_media_list(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_media_list_items(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_media_list_members(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_media_list_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_task_board_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_task_board(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_task_board_tasks(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_share_task_board(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_task_board_insert_check() CASCADE;
