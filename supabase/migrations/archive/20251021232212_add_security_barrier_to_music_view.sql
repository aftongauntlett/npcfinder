-- Migration: Add Security Barrier to Music Recommendations View
-- Date: October 21, 2025
-- Purpose: Add security_barrier='true' to music_recommendations_with_users view for consistency
--
-- SECURITY ISSUE: The movie_recommendations_with_users view has security_barrier='true',
-- but music_recommendations_with_users does not. This creates an inconsistency in security posture.
--
-- What security_barrier does:
-- Prevents query optimization from pushing predicates down in ways that could leak information
-- through side effects (e.g., error messages from functions in WHERE clauses).
-- This is important for views that join sensitive data from multiple tables.
--
-- This migration recreates the view with security_barrier enabled, maintaining identical logic.

CREATE OR REPLACE VIEW "public"."music_recommendations_with_users" 
WITH (security_barrier='true')
AS
 SELECT "mr"."id",
    "mr"."from_user_id",
    "mr"."to_user_id",
    "mr"."external_id",
    "mr"."media_type",
    "mr"."title",
    "mr"."artist",
    "mr"."album",
    "mr"."release_date",
    "mr"."poster_url",
    "mr"."preview_url",
    "mr"."recommendation_type",
    "mr"."status",
    "mr"."sent_message",
    "mr"."sender_note",
    "mr"."recipient_note",
    "mr"."created_at",
    "mr"."consumed_at",
    "mr"."opened_at",
    "from_profile"."display_name" AS "sender_name",
    "to_profile"."display_name" AS "recipient_name"
   FROM (("public"."music_recommendations" "mr"
     LEFT JOIN "public"."user_profiles" "from_profile" ON (("mr"."from_user_id" = "from_profile"."user_id")))
     LEFT JOIN "public"."user_profiles" "to_profile" ON (("mr"."to_user_id" = "to_profile"."user_id")));

ALTER VIEW "public"."music_recommendations_with_users" OWNER TO "postgres";
