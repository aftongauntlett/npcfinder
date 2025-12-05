/**
 * Reviews Service - Supabase Implementation
 * Handles CRUD operations for media reviews and friend review fetching
 * Canonical service for all media review operations
 */

import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import type {
  MediaReview,
  MediaReviewWithUser,
  CreateReviewData,
  UpdateReviewData,
} from "./reviewsService.types";
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewQuerySchema,
  ReviewIdSchema,
} from "./reviewsService.validation";
import { z } from "zod";

// Simple validation schema for functions that don't need userId
const MediaQuerySchema = z.object({
  externalId: z.string().min(1, "External ID is required"),
  mediaType: z.enum([
    "movie",
    "tv",
    "song",
    "album",
    "playlist",
    "game",
    "book",
  ]),
});

/**
 * Get the current user's review for a specific media item
 * Requires explicit userId parameter for use with AuthContext
 */
export async function getMyReview(
  userId: string,
  externalId: string,
  mediaType: string
): Promise<MediaReview | null> {
  try {
    // Validate inputs
    const validated = ReviewQuerySchema.parse({
      userId,
      externalId,
      mediaType,
    });

    const { data, error } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("user_id", validated.userId)
      .eq("external_id", validated.externalId)
      .eq("media_type", validated.mediaType)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - user hasn't reviewed this item yet
        return null;
      }
      throw new Error(
        `Failed to fetch review for user ${userId}, media ${externalId}: ${error.message}`
      );
    }

    return data;
  } catch (error) {
    logger.error("Error fetching user review:", error);
    throw error;
  }
}

/**
 * Get the current authenticated user's review for a specific media item
 * Automatically fetches userId from auth session
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
 * Get public reviews from friends for a specific media item
 * Requires explicit userId parameter for use with AuthContext
 */
export async function getFriendsReviews(
  userId: string,
  externalId: string,
  mediaType: string
): Promise<MediaReviewWithUser[]> {
  try {
    // Validate inputs
    const validated = ReviewQuerySchema.parse({
      userId,
      externalId,
      mediaType,
    });

    // First, query reviews for the media item
    const { data: reviews, error: reviewsError } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("external_id", validated.externalId)
      .eq("media_type", validated.mediaType)
      .eq("is_public", true)
      .neq("user_id", validated.userId)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      throw new Error(
        `Failed to fetch friends' reviews for media ${externalId}: ${reviewsError.message}`
      );
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // Collect distinct user_ids
    const userIds = [...new Set(reviews.map((r) => r.user_id))];

    // Query user_profiles for display names
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (profilesError) {
      throw new Error(
        `Failed to fetch user profiles for reviews: ${profilesError.message}`
      );
    }

    // Build a map from user_id to display_name
    const displayNameMap = new Map<string, string>();
    (profiles || []).forEach((profile) => {
      displayNameMap.set(profile.user_id, profile.display_name);
    });

    // Merge display names into review objects
    const reviewsWithUsers: MediaReviewWithUser[] = reviews.map((review) => ({
      ...review,
      display_name: displayNameMap.get(review.user_id) || "Anonymous",
    }));

    return reviewsWithUsers;
  } catch (error) {
    logger.error("Error fetching friends reviews:", error);
    return []; // Return empty array on error instead of throwing
  }
}

/**
 * Get friends' public reviews for a specific media item
 * Automatically fetches userId from auth session
 */
export async function getFriendsMediaReviews(
  externalId: string,
  mediaType: string
): Promise<MediaReviewWithUser[]> {
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

      const reviewsWithUsers: MediaReviewWithUser[] = data.map((review) => ({
        ...review,
        display_name: profileMap.get(review.user_id) || "Unknown User",
      }));

      return reviewsWithUsers;
    }

    return [];
  } catch (error) {
    logger.error("Error fetching friends' media reviews:", error);
    // Return empty array on error for non-critical data
    return [];
  }
}

/**
 * Create a new review
 */
export async function createReview(
  data: CreateReviewData
): Promise<MediaReview> {
  try {
    // Validate input data
    const validated = CreateReviewSchema.parse(data);

    const { data: review, error } = await supabase
      .from("media_reviews")
      .insert([validated])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === "23505") {
        throw new Error(
          `Review already exists for ${data.title} (${data.media_type})`
        );
      }
      throw new Error(
        `Failed to create review for ${data.title}: ${error.message}`
      );
    }

    return review;
  } catch (error) {
    logger.error("Error creating review:", error);
    throw error;
  }
}

/**
 * Create or update user's review (upsert)
 * Automatically uses authenticated user's ID
 */
export async function upsertMediaReview(
  reviewData: Omit<CreateReviewData, "user_id">
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
 * Update an existing review
 */
export async function updateReview(
  reviewId: string,
  data: UpdateReviewData
): Promise<MediaReview> {
  try {
    // Validate inputs
    const validatedId = ReviewIdSchema.parse(reviewId);
    const validatedData = UpdateReviewSchema.parse(data);

    const { data: review, error } = await supabase
      .from("media_reviews")
      .update(validatedData)
      .eq("id", validatedId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update review ${reviewId}: ${error.message}`);
    }

    return review;
  } catch (error) {
    logger.error("Error updating review:", error);
    throw error;
  }
}

/**
 * Update specific fields of existing review (alias for updateReview)
 * Provided for API compatibility
 */
export async function updateMediaReview(
  reviewId: string,
  updates: UpdateReviewData
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
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    // Validate review ID
    const validatedId = ReviewIdSchema.parse(reviewId);

    const { error } = await supabase
      .from("media_reviews")
      .delete()
      .eq("id", validatedId);

    if (error) {
      throw new Error(`Failed to delete review ${reviewId}: ${error.message}`);
    }
  } catch (error) {
    logger.error("Error deleting review:", error);
    throw error;
  }
}

/**
 * Delete user's review (alias for deleteReview)
 * Provided for API compatibility
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

/**
 * Toggle review privacy (quick helper)
 */
export async function toggleReviewPrivacy(
  reviewId: string,
  isPublic: boolean
): Promise<MediaReview> {
  try {
    // Validate review ID
    const validatedId = ReviewIdSchema.parse(reviewId);

    const { data: review, error } = await supabase
      .from("media_reviews")
      .update({ is_public: isPublic })
      .eq("id", validatedId)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to toggle privacy for review ${reviewId}: ${error.message}`
      );
    }

    return review;
  } catch (error) {
    logger.error("Error toggling review privacy:", error);
    throw error;
  }
}
