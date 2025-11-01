import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewIdSchema,
} from "./reviewsService.validation";
import { z } from "zod";

export interface MediaReview {
  id: string;
  user_id: string;
  external_id: string;
  media_type: string;
  title: string;
  rating: number | null;
  liked: boolean | null;
  review_text: string | null;
  is_public: boolean;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edited_at: string | null;
  // Joined from user_profiles
  display_name?: string;
}

export interface CreateMediaReviewData {
  external_id: string;
  media_type: string;
  title: string;
  rating?: number | null;
  liked?: boolean | null;
  review_text?: string | null;
  is_public?: boolean;
  watched_at?: string | null;
}

export interface UpdateMediaReviewData {
  rating?: number | null;
  liked?: boolean | null;
  review_text?: string | null;
  is_public?: boolean;
  watched_at?: string | null;
}

// Simple validation schemas for this service's specific needs
const MediaQuerySchema = z.object({
  externalId: z.string().min(1, "External ID is required"),
  mediaType: z.enum(["movie", "tv", "song", "album", "book"]),
});

/**
 * Get current user's review for a specific media item
 */
export async function getMyMediaReview(
  externalId: string,
  mediaType: string
): Promise<MediaReview | null> {
  try {
    // Validate inputs
    const validated = MediaQuerySchema.parse({ externalId, mediaType });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User must be authenticated to fetch their review");
    }

    const { data, error } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("user_id", user.id)
      .eq("external_id", validated.externalId)
      .eq("media_type", validated.mediaType)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to fetch review for ${mediaType} ${externalId}: ${error.message}`,
        { cause: error }
      );
    }

    return data;
  } catch (error) {
    logger.error("Error fetching user's media review:", error);
    throw error;
  }
}

/**
 * Get friends' public reviews for a specific media item
 */
export async function getFriendsMediaReviews(
  externalId: string,
  mediaType: string
): Promise<MediaReview[]> {
  try {
    // Validate inputs
    const validated = MediaQuerySchema.parse({ externalId, mediaType });

    // Get current user to filter out their own review
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("external_id", validated.externalId)
      .eq("media_type", validated.mediaType)
      .eq("is_public", true)
      .neq("user_id", user?.id || "")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch friends' reviews for ${mediaType} ${externalId}: ${error.message}`,
        { cause: error }
      );
    }

    // Fetch display names separately
    if (data && data.length > 0) {
      const userIds = data.map((review) => review.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      if (profileError) {
        throw new Error(
          `Failed to fetch user profiles for reviews: ${profileError.message}`,
          { cause: profileError }
        );
      }

      // Map display names to reviews
      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p.display_name]) || []
      );

      const reviews = data.map((review) => ({
        ...review,
        display_name: profileMap.get(review.user_id) || "Unknown User",
      })) as MediaReview[];

      return reviews;
    }

    return [];
  } catch (error) {
    logger.error("Error fetching friends' media reviews:", error);
    // Return empty array on error for non-critical data
    return [];
  }
}

/**
 * Create or update user's review (upsert)
 */
export async function upsertMediaReview(
  reviewData: CreateMediaReviewData
): Promise<MediaReview> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User must be authenticated to create/update a review");
    }

    // Validate review data
    const validated = CreateReviewSchema.parse({
      user_id: user.id,
      ...reviewData,
    });

    const { data, error } = await supabase
      .from("media_reviews")
      .upsert(validated, {
        onConflict: "user_id,external_id,media_type",
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to save review for ${reviewData.title}: ${error.message}`,
        { cause: error }
      );
    }

    return data;
  } catch (error) {
    logger.error("Error upserting media review:", error);
    throw error;
  }
}

/**
 * Update existing review
 */
export async function updateMediaReview(
  reviewId: string,
  updates: UpdateMediaReviewData
): Promise<MediaReview> {
  try {
    // Validate inputs
    const validatedId = ReviewIdSchema.parse(reviewId);
    const validatedUpdates = UpdateReviewSchema.parse(updates);

    const { data, error } = await supabase
      .from("media_reviews")
      .update(validatedUpdates)
      .eq("id", validatedId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update review ${reviewId}: ${error.message}`, {
        cause: error,
      });
    }

    return data;
  } catch (error) {
    logger.error("Error updating media review:", error);
    throw error;
  }
}

/**
 * Delete user's review
 */
export async function deleteMediaReview(reviewId: string): Promise<void> {
  try {
    // Validate review ID
    const validatedId = ReviewIdSchema.parse(reviewId);

    const { error } = await supabase
      .from("media_reviews")
      .delete()
      .eq("id", validatedId);

    if (error) {
      throw new Error(`Failed to delete review ${reviewId}: ${error.message}`, {
        cause: error,
      });
    }
  } catch (error) {
    logger.error("Error deleting media review:", error);
    throw error;
  }
}
