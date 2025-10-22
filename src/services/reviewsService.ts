/**
 * Reviews Service - Supabase Implementation
 * Handles CRUD operations for media reviews and friend review fetching
 */

import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import type {
  MediaReview,
  MediaReviewWithUser,
  CreateReviewData,
  UpdateReviewData,
} from "./reviewsService.types";

/**
 * Get the current user's review for a specific media item
 */
export async function getMyReview(
  userId: string,
  externalId: string,
  mediaType: string
): Promise<MediaReview | null> {
  try {
    const { data, error } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("external_id", externalId)
      .eq("media_type", mediaType)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - user hasn't reviewed this item yet
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Error fetching user review:", error);
    throw error;
  }
}

/**
 * Get public reviews from friends for a specific media item
 */
export async function getFriendsReviews(
  userId: string,
  externalId: string,
  mediaType: string
): Promise<MediaReviewWithUser[]> {
  try {
    // First, query reviews for the media item
    const { data: reviews, error: reviewsError } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("external_id", externalId)
      .eq("media_type", mediaType)
      .eq("is_public", true)
      .neq("user_id", userId)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      throw reviewsError;
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
      throw profilesError;
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
 * Create a new review
 */
export async function createReview(
  data: CreateReviewData
): Promise<MediaReview> {
  try {
    const { data: review, error } = await supabase
      .from("media_reviews")
      .insert([data])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === "23505") {
        throw new Error("You have already reviewed this item");
      }
      throw error;
    }

    return review;
  } catch (error) {
    logger.error("Error creating review:", error);
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
    const { data: review, error } = await supabase
      .from("media_reviews")
      .update(data)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return review;
  } catch (error) {
    logger.error("Error updating review:", error);
    throw error;
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("media_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error("Error deleting review:", error);
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
    const { data: review, error } = await supabase
      .from("media_reviews")
      .update({ is_public: isPublic })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return review;
  } catch (error) {
    logger.error("Error toggling review privacy:", error);
    throw error;
  }
}
