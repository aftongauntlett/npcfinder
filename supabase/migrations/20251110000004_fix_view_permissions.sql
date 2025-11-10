-- Migration: Fix permissions on security-barrier views
-- Date: November 10, 2025
-- Purpose: Ensure all *_with_users views have proper GRANT permissions
--
-- When recreating views with security_barrier='true', permissions aren't
-- automatically preserved. This migration explicitly grants SELECT to
-- authenticated users on all recommendation views.

-- Music recommendations view (missing from previous migration)
GRANT SELECT ON "public"."music_recommendations_with_users" TO authenticated;

-- Book recommendations view (redundant but safe)
GRANT SELECT ON "public"."book_recommendations_with_users" TO authenticated;

-- Game recommendations view (redundant but safe)
GRANT SELECT ON "public"."game_recommendations_with_users" TO authenticated;

-- Movie recommendations view (redundant but safe)
GRANT SELECT ON "public"."movie_recommendations_with_users" TO authenticated;
