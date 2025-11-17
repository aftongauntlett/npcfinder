-- Migration: Add composite indexes for frequent query patterns
-- Date: 2025-10-21
-- Description: Improves query performance for recommendations and watchlist filtering
-- 
-- Query patterns optimized:
-- 1. movie_recommendations: to_user_id + status + created_at (received recs by status)
-- 2. movie_recommendations: from_user_id + created_at (sent recs)
-- 3. movie_recommendations: to_user_id + media_type + created_at (received recs by type)
-- 4. music_recommendations: to_user_id + status + created_at (received recs by status)
-- 5. music_recommendations: from_user_id + created_at (sent recs)
-- 6. user_watchlist: user_id + watched + added_at (watchlist by watched status)
-- 7. user_watchlist: user_id + external_id (duplicate check)

-- =====================================================
-- MOVIE RECOMMENDATIONS INDEXES
-- =====================================================

-- Index for: received recommendations filtered by status, ordered by date
-- Query: SELECT * FROM movie_recommendations WHERE to_user_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_movie_recs_to_user_status_created 
ON movie_recommendations(to_user_id, status, created_at DESC);

-- Index for: sent recommendations, ordered by date
-- Query: SELECT * FROM movie_recommendations WHERE from_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_movie_recs_from_user_created 
ON movie_recommendations(from_user_id, created_at DESC);

-- Index for: received recommendations filtered by media type, ordered by date
-- Query: SELECT * FROM movie_recommendations WHERE to_user_id = ? AND media_type = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_movie_recs_to_user_type_created 
ON movie_recommendations(to_user_id, media_type, created_at DESC);

-- Index for: received recommendations with no filter (all statuses), ordered by date
-- Query: SELECT * FROM movie_recommendations WHERE to_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_movie_recs_to_user_created 
ON movie_recommendations(to_user_id, created_at DESC);

-- =====================================================
-- MUSIC RECOMMENDATIONS INDEXES
-- =====================================================

-- Index for: received recommendations filtered by status, ordered by date
-- Query: SELECT * FROM music_recommendations WHERE to_user_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_music_recs_to_user_status_created 
ON music_recommendations(to_user_id, status, created_at DESC);

-- Index for: sent recommendations, ordered by date
-- Query: SELECT * FROM music_recommendations WHERE from_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_music_recs_from_user_created 
ON music_recommendations(from_user_id, created_at DESC);

-- Index for: received recommendations filtered by media type, ordered by date
-- Query: SELECT * FROM music_recommendations WHERE to_user_id = ? AND media_type = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_music_recs_to_user_type_created 
ON music_recommendations(to_user_id, media_type, created_at DESC);

-- Index for: received recommendations with no filter (all statuses), ordered by date
-- Query: SELECT * FROM music_recommendations WHERE to_user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_music_recs_to_user_created 
ON music_recommendations(to_user_id, created_at DESC);

-- =====================================================
-- USER WATCHLIST INDEXES
-- =====================================================

-- Index for: watchlist items filtered by watched status, ordered by added date
-- Query: SELECT * FROM user_watchlist WHERE user_id = ? AND watched = ? ORDER BY added_at DESC
CREATE INDEX IF NOT EXISTS idx_watchlist_user_watched_added 
ON user_watchlist(user_id, watched, added_at DESC);

-- Index for: all watchlist items for a user, ordered by added date
-- Query: SELECT * FROM user_watchlist WHERE user_id = ? ORDER BY added_at DESC
CREATE INDEX IF NOT EXISTS idx_watchlist_user_added 
ON user_watchlist(user_id, added_at DESC);

-- Index for: duplicate check when adding to watchlist
-- Query: SELECT * FROM user_watchlist WHERE user_id = ? AND external_id = ?
CREATE INDEX IF NOT EXISTS idx_watchlist_user_external 
ON user_watchlist(user_id, external_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these queries in Supabase SQL Editor to verify indexes are being used:
-- 
-- EXPLAIN ANALYZE 
-- SELECT * FROM movie_recommendations 
-- WHERE to_user_id = 'some-uuid' AND status = 'pending' 
-- ORDER BY created_at DESC;
--
-- EXPLAIN ANALYZE
-- SELECT * FROM user_watchlist
-- WHERE user_id = 'some-uuid' AND watched = false
-- ORDER BY added_at DESC;
--
-- Look for "Index Scan using idx_..." in the output (not "Seq Scan")
