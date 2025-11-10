-- Migration: Add composite indexes for book and game recommendations
-- Date: November 10, 2025
-- Description: Brings book and game recommendation indexes to parity with movie/music
--
-- Adds composite indexes to support frequent query patterns:
-- 1. (to_user_id, status, created_at) - received recommendations filtered by status
-- 2. (from_user_id, created_at) - sent recommendations ordered by date
--
-- These match the patterns already in place for movie_recommendations and music_recommendations

-- =====================================================
-- BOOK RECOMMENDATIONS COMPOSITE INDEXES
-- =====================================================

-- Index for: received recommendations filtered by status, ordered by date
-- Query: SELECT * FROM book_recommendations WHERE to_user_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_book_recs_to_user_status_created 
ON book_recommendations(to_user_id, status, created_at DESC);

-- Index for: sent recommendations, ordered by date
-- Query: SELECT * FROM book_recommendations WHERE from_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_book_recs_from_user_created 
ON book_recommendations(from_user_id, created_at DESC);

-- Index for: received recommendations with no filter (all statuses), ordered by date
-- Query: SELECT * FROM book_recommendations WHERE to_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_book_recs_to_user_created 
ON book_recommendations(to_user_id, created_at DESC);

-- =====================================================
-- GAME RECOMMENDATIONS COMPOSITE INDEXES
-- =====================================================

-- Index for: received recommendations filtered by status, ordered by date
-- Query: SELECT * FROM game_recommendations WHERE to_user_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_game_recs_to_user_status_created 
ON game_recommendations(to_user_id, status, created_at DESC);

-- Index for: sent recommendations, ordered by date
-- Query: SELECT * FROM game_recommendations WHERE from_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_game_recs_from_user_created 
ON game_recommendations(from_user_id, created_at DESC);

-- Index for: received recommendations with no filter (all statuses), ordered by date
-- Query: SELECT * FROM game_recommendations WHERE to_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_game_recs_to_user_created 
ON game_recommendations(to_user_id, created_at DESC);

-- =====================================================
-- NOTES
-- =====================================================
-- The existing simple indexes on these tables remain valid:
-- - idx_book_recs_to_user (to_user_id, status) - can be used for status-filtered queries
-- - idx_book_recs_from_user (from_user_id) - can be used for from_user queries
-- - idx_book_recs_created_at (created_at DESC) - can be used for global ordering
--
-- Postgres query planner will choose the most efficient index based on the query.
-- The composite indexes added here are specifically optimized for the most common
-- query patterns in the application.
