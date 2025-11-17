-- Create media_reviews table for storing user reviews, ratings, and likes
-- Supports all media types (movies, TV, music, books, games)
-- Reviews are visible to friends based on privacy settings

CREATE TABLE IF NOT EXISTS "public"."media_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "rating" integer,
    "liked" boolean,
    "review_text" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "watched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "media_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "media_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "media_reviews_unique_user_media" UNIQUE ("user_id", "external_id", "media_type"),
    CONSTRAINT "media_reviews_media_type_check" CHECK (("media_type" = ANY (ARRAY['movie'::"text", 'tv'::"text", 'song'::"text", 'album'::"text", 'book'::"text", 'game'::"text"]))),
    CONSTRAINT "media_reviews_rating_check" CHECK (("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5)))
);

ALTER TABLE "public"."media_reviews" OWNER TO "postgres";

-- Add comments
COMMENT ON TABLE "public"."media_reviews" IS 'Media-agnostic review system for storing user reviews, ratings, and likes. Reviews are visible to friends based on privacy settings.';

COMMENT ON COLUMN "public"."media_reviews"."external_id" IS 'External API ID (TMDB, iTunes, etc.)';
COMMENT ON COLUMN "public"."media_reviews"."media_type" IS 'Type of media: movie, tv, song, album, book, game';
COMMENT ON COLUMN "public"."media_reviews"."rating" IS '1-5 star rating (optional)';
COMMENT ON COLUMN "public"."media_reviews"."liked" IS 'Simple thumbs up (true) / thumbs down (false) / neutral (null)';
COMMENT ON COLUMN "public"."media_reviews"."is_public" IS 'Whether review is visible to friends (true) or private (false)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "media_reviews_user_id_idx" ON "public"."media_reviews" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "media_reviews_external_id_media_type_idx" ON "public"."media_reviews" USING "btree" ("external_id", "media_type");
CREATE INDEX IF NOT EXISTS "media_reviews_user_id_media_type_idx" ON "public"."media_reviews" USING "btree" ("user_id", "media_type");
CREATE INDEX IF NOT EXISTS "media_reviews_is_public_idx" ON "public"."media_reviews" USING "btree" ("is_public");

-- Add trigger to update updated_at timestamp
CREATE TRIGGER "update_media_reviews_updated_at" 
    BEFORE UPDATE ON "public"."media_reviews" 
    FOR EACH ROW 
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable Row Level Security
ALTER TABLE "public"."media_reviews" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own reviews
CREATE POLICY "Users can view own reviews" ON "public"."media_reviews"
    FOR SELECT
    USING ("user_id" = "auth"."uid"());

-- RLS Policy: Users can view public reviews from friends
-- Note: connections table has no status column; all connections are considered active/accepted
-- If connection status is added in future, update this policy to filter by status = 'accepted'
CREATE POLICY "Users can view friends public reviews" ON "public"."media_reviews"
    FOR SELECT
    USING (
        "is_public" = true 
        AND "user_id" IN (
            SELECT "user_id" FROM "public"."connections" 
            WHERE "friend_id" = "auth"."uid"()
            UNION
            SELECT "friend_id" FROM "public"."connections" 
            WHERE "user_id" = "auth"."uid"()
        )
    );

-- RLS Policy: Users can create their own reviews
CREATE POLICY "Users can create own reviews" ON "public"."media_reviews"
    FOR INSERT
    WITH CHECK ("user_id" = "auth"."uid"());

-- RLS Policy: Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON "public"."media_reviews"
    FOR UPDATE
    USING ("user_id" = "auth"."uid"())
    WITH CHECK ("user_id" = "auth"."uid"());

-- RLS Policy: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON "public"."media_reviews"
    FOR DELETE
    USING ("user_id" = "auth"."uid"());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."media_reviews" TO "authenticated";
