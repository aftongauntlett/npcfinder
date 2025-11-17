-- Migration: Add Security Barrier to Book Recommendations View
-- Date: November 10, 2025
-- Purpose: Add security_barrier='true' to book_recommendations_with_users view for consistency
--
-- SECURITY ISSUE: The movie_recommendations_with_users and music_recommendations_with_users views
-- have security_barrier='true', but book_recommendations_with_users does not.
-- This creates an inconsistency in security posture.
--
-- What security_barrier does:
-- Prevents query optimization from pushing predicates down in ways that could leak information
-- through side effects (e.g., error messages from functions in WHERE clauses).
-- This is important for views that join sensitive data from multiple tables.
--
-- This migration recreates the view with security_barrier enabled, maintaining identical logic.

CREATE OR REPLACE VIEW "public"."book_recommendations_with_users" 
WITH (security_barrier='true')
AS
SELECT 
  br.id,
  br.from_user_id,
  br.to_user_id,
  br.external_id,
  br.title,
  br.authors,
  br.thumbnail_url,
  br.published_date,
  br.description,
  br.isbn,
  br.page_count,
  br.recommendation_type,
  br.status,
  br.sent_message,
  br.sender_note,
  br.recipient_note,
  br.created_at,
  br.read_at,
  br.opened_at,
  from_profile.display_name AS sender_name,
  to_profile.display_name AS recipient_name
FROM book_recommendations br
LEFT JOIN user_profiles from_profile ON br.from_user_id = from_profile.user_id
LEFT JOIN user_profiles to_profile ON br.to_user_id = to_profile.user_id;

ALTER VIEW "public"."book_recommendations_with_users" OWNER TO "postgres";

GRANT SELECT ON "public"."book_recommendations_with_users" TO authenticated;
