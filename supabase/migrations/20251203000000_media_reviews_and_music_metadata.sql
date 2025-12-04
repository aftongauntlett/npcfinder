-- =====================================================
-- MEDIA REVIEWS AND MUSIC METADATA
-- =====================================================
-- Created: December 3, 2025
-- Purpose: Add media reviews system and music metadata enhancements
--          1. Create media_reviews table for all media types
--          2. Add track_duration and track_count to music_library
-- =====================================================

-- =====================================================
-- CREATE MEDIA REVIEWS TABLE
-- =====================================================

-- Create media_reviews table
CREATE TABLE IF NOT EXISTS "public"."media_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "rating" integer,
    "review_text" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "watched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_edited" boolean DEFAULT false NOT NULL,
    "edited_at" timestamp with time zone,
    CONSTRAINT "media_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "media_reviews_user_media_unique" UNIQUE ("user_id", "external_id", "media_type"),
    CONSTRAINT "media_reviews_media_type_check" CHECK (("media_type" = ANY (ARRAY['movie'::"text", 'tv'::"text", 'song'::"text", 'album'::"text", 'playlist'::"text", 'game'::"text", 'book'::"text"]))),
    CONSTRAINT "media_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);

ALTER TABLE "public"."media_reviews" OWNER TO "postgres";

COMMENT ON TABLE "public"."media_reviews" IS 'User reviews for all media types (movies, TV, music, games, books) with 1-5 star ratings, markdown-enabled comments, and public/private visibility';

COMMENT ON COLUMN "public"."media_reviews"."rating" IS '1-5 star rating (optional)';
COMMENT ON COLUMN "public"."media_reviews"."review_text" IS 'User review text with markdown support';
COMMENT ON COLUMN "public"."media_reviews"."is_public" IS 'Whether friends can see this review';
COMMENT ON COLUMN "public"."media_reviews"."is_edited" IS 'Tracks if review has been edited after creation';

-- Add foreign key constraint
ALTER TABLE ONLY "public"."media_reviews"
    ADD CONSTRAINT "media_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX "media_reviews_user_id_idx" ON "public"."media_reviews" USING "btree" ("user_id");
CREATE INDEX "media_reviews_external_id_idx" ON "public"."media_reviews" USING "btree" ("external_id");
CREATE INDEX "media_reviews_media_type_idx" ON "public"."media_reviews" USING "btree" ("media_type");
CREATE INDEX "media_reviews_is_public_idx" ON "public"."media_reviews" USING "btree" ("is_public");
CREATE INDEX "media_reviews_created_at_idx" ON "public"."media_reviews" USING "btree" ("created_at" DESC);

-- Enable RLS
ALTER TABLE "public"."media_reviews" ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users only (not anon for security)
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."media_reviews" TO "authenticated";

-- RLS Policies

-- Users can view their own reviews
CREATE POLICY "Users can view their own reviews"
    ON "public"."media_reviews"
    FOR SELECT
    USING ("auth"."uid"() = "user_id");

-- Users can view public reviews from friends
CREATE POLICY "Users can view public reviews from friends"
    ON "public"."media_reviews"
    FOR SELECT
    USING (
        "is_public" = true
        AND EXISTS (
            SELECT 1
            FROM "public"."connections"
            WHERE (
                ("user_id" = "auth"."uid"() AND "friend_id" = "media_reviews"."user_id")
                OR ("friend_id" = "auth"."uid"() AND "user_id" = "media_reviews"."user_id")
            )
        )
    );

-- Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews"
    ON "public"."media_reviews"
    FOR INSERT
    WITH CHECK ("auth"."uid"() = "user_id");

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
    ON "public"."media_reviews"
    FOR UPDATE
    USING ("auth"."uid"() = "user_id")
    WITH CHECK ("auth"."uid"() = "user_id");

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
    ON "public"."media_reviews"
    FOR DELETE
    USING ("auth"."uid"() = "user_id");

-- Create trigger to update updated_at and is_edited
CREATE OR REPLACE FUNCTION "public"."handle_media_review_update"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- Only mark as edited if it's not a brand new insert
    IF TG_OP = 'UPDATE' AND OLD.created_at < now() - interval '1 minute' THEN
        NEW.is_edited = true;
        NEW.edited_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE TRIGGER "update_media_reviews_modtime"
    BEFORE UPDATE ON "public"."media_reviews"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_media_review_update"();

-- =====================================================
-- ADD MUSIC METADATA FIELDS
-- =====================================================

-- Add track_duration column (in milliseconds, matching iTunes API)
ALTER TABLE "public"."music_library"
ADD COLUMN IF NOT EXISTS "track_duration" integer;

-- Add track_count column (for albums)
ALTER TABLE "public"."music_library"
ADD COLUMN IF NOT EXISTS "track_count" integer;

-- Add comments
COMMENT ON COLUMN "public"."music_library"."track_duration" IS 'Track duration in milliseconds (for songs)';
COMMENT ON COLUMN "public"."music_library"."track_count" IS 'Number of tracks (for albums)';
