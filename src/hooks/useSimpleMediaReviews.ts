/**
 * React Query hooks for the new simplified media_reviews system
 * Separate from the old reviews system - this uses the media_reviews table
 * with 1-5 ratings, edit tracking, and simpler structure
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyMediaReview,
  getFriendsMediaReviews,
  upsertMediaReview,
  updateMediaReview,
  deleteMediaReview,
} from "../services/reviewsService";
import type {
  MediaReview,
  CreateReviewData,
  UpdateReviewData,
} from "../services/reviewsService.types";

// Type for creating a review without user_id (auto-filled by service)
type CreateMediaReviewData = Omit<CreateReviewData, "user_id">;
type UpdateMediaReviewData = UpdateReviewData;

/**
 * Hook to get current user's review for a specific media item
 */
export function useMyMediaReview(
  externalId: string,
  mediaType: string,
  enabled = true
) {
  return useQuery({
    queryKey: ["myMediaReview", externalId, mediaType],
    queryFn: () => getMyMediaReview(externalId, mediaType),
    enabled: enabled && !!externalId && !!mediaType,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get friends' public reviews for a specific media item
 */
export function useFriendsMediaReviews(
  externalId: string,
  mediaType: string,
  enabled = true
) {
  return useQuery({
    queryKey: ["friendsMediaReviews", externalId, mediaType],
    queryFn: () => getFriendsMediaReviews(externalId, mediaType),
    enabled: enabled && !!externalId && !!mediaType,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to create or update review (upsert)
 * This is the main mutation for saving reviews
 */
export function useUpsertMediaReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewData: CreateMediaReviewData) =>
      upsertMediaReview(reviewData),
    onSuccess: (_, variables) => {
      // Invalidate my review query
      void queryClient.invalidateQueries({
        queryKey: [
          "myMediaReview",
          variables.external_id,
          variables.media_type,
        ],
      });
      // Invalidate friends reviews (in case it became public)
      void queryClient.invalidateQueries({
        queryKey: [
          "friendsMediaReviews",
          variables.external_id,
          variables.media_type,
        ],
      });
    },
  });
}

/**
 * Hook to update specific fields of existing review
 */
export function useUpdateMediaReview(externalId: string, mediaType: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      updates,
    }: {
      reviewId: string;
      updates: UpdateMediaReviewData;
    }) => updateMediaReview(reviewId, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["myMediaReview", externalId, mediaType],
      });
      void queryClient.invalidateQueries({
        queryKey: ["friendsMediaReviews", externalId, mediaType],
      });
    },
  });
}

/**
 * Hook to delete review
 */
export function useDeleteMediaReview(externalId: string, mediaType: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteMediaReview(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["myMediaReview", externalId, mediaType],
      });
      void queryClient.invalidateQueries({
        queryKey: ["friendsMediaReviews", externalId, mediaType],
      });
    },
  });
}

/**
 * Hook to toggle privacy setting
 * Convenience wrapper around updateMediaReview
 */
export function useToggleReviewPrivacy(externalId: string, mediaType: string) {
  const updateMutation = useUpdateMediaReview(externalId, mediaType);

  return useMutation({
    mutationFn: async ({
      reviewId,
      isPublic,
    }: {
      reviewId: string;
      isPublic: boolean;
    }) => {
      return updateMutation.mutateAsync({
        reviewId,
        updates: { is_public: isPublic },
      });
    },
  });
}

/**
 * Hook to update just the like/dislike
 * Convenience wrapper for quick reactions
 * DEPRECATED: Liked field removed from schema
 */
export function useUpdateReviewLike() {
  return useMutation({
    mutationFn: async () => {
      // Liked field removed from schema - this is now a no-op
      return Promise.resolve({} as MediaReview);
    },
  });
}

/**
 * Hook to update just the rating
 * Convenience wrapper for quick rating updates
 */
export function useUpdateReviewRating(externalId: string, mediaType: string) {
  const updateMutation = useUpdateMediaReview(externalId, mediaType);

  return useMutation({
    mutationFn: async ({
      reviewId,
      rating,
    }: {
      reviewId: string;
      rating: number | null;
    }) => {
      return updateMutation.mutateAsync({
        reviewId,
        updates: { rating },
      });
    },
  });
}
