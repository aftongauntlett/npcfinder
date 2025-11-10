-- Migration: Add Security Barrier to Game Recommendations View
-- Date: November 10, 2025
-- Purpose: Add security_barrier='true' to game_recommendations_with_users view for consistency
--
-- SECURITY ISSUE: The movie_recommendations_with_users and music_recommendations_with_users views
-- have security_barrier='true', but game_recommendations_with_users does not.
-- This creates an inconsistency in security posture.
--
-- What security_barrier does:
-- Prevents query optimization from pushing predicates down in ways that could leak information
-- through side effects (e.g., error messages from functions in WHERE clauses).
-- This is important for views that join sensitive data from multiple tables.
--
-- This migration recreates the view with security_barrier enabled, maintaining identical logic.

CREATE OR REPLACE VIEW "public"."game_recommendations_with_users" 
WITH (security_barrier='true')
AS
SELECT 
  gr.*,
  from_profile.display_name AS sender_name,
  to_profile.display_name AS recipient_name
FROM game_recommendations gr
LEFT JOIN user_profiles from_profile ON gr.from_user_id = from_profile.user_id
LEFT JOIN user_profiles to_profile ON gr.to_user_id = to_profile.user_id;

ALTER VIEW "public"."game_recommendations_with_users" OWNER TO "postgres";

GRANT SELECT ON "public"."game_recommendations_with_users" TO authenticated;

COMMENT ON VIEW "public"."game_recommendations_with_users" IS 'Game recommendations with sender and recipient display names for easier querying';
