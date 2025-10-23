/**
 * React Query hooks for the new simplified media_reviews system
 * Separate from the old reviews system - this uses the media_reviews table
 * with 1-10 ratings, edit tracking, and simpler structure
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyMediaReview,
  getFriendsMediaReviews,
  upsertMediaReview,
  updateMediaReview,
  deleteMediaReview,
  type CreateMediaReviewData,
  type UpdateMediaReviewData,
} from "../services/mediaReviewsService";

/**
 * Hook to get current user's review for a specific media item
 */
export function useMyMediaReview(externalId: string, mediaType: string) {
  return useQuery({
    queryKey: ["myMediaReview", externalId, mediaType],
    queryFn: async () => {
      const { data, error } = await getMyMediaReview(externalId, mediaType);
      if (error) throw error;
      return data;
    },
    enabled: !!externalId && !!mediaType,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get friends' public reviews for a specific media item
 */
export function useFriendsMediaReviews(externalId: string, mediaType: string) {
  return useQuery({
    queryKey: ["friendsMediaReviews", externalId, mediaType],
    queryFn: async () => {
      const { data, error } = await getFriendsMediaReviews(
        externalId,
        mediaType
      );
      if (error) throw error;
      return data;
    },
    enabled: !!externalId && !!mediaType,
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
    mutationFn: async (reviewData: CreateMediaReviewData) => {
      const { data, error } = await upsertMediaReview(reviewData);
      if (error) throw error;
      return data;
    },
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
    mutationFn: async ({
      reviewId,
      updates,
    }: {
      reviewId: string;
      updates: UpdateMediaReviewData;
    }) => {
      const { data, error } = await updateMediaReview(reviewId, updates);
      if (error) throw error;
      return data;
    },
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
    mutationFn: async (reviewId: string) => {
      const { error } = await deleteMediaReview(reviewId);
      if (error) throw error;
    },
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
 */
export function useUpdateReviewLike(externalId: string, mediaType: string) {
  const updateMutation = useUpdateMediaReview(externalId, mediaType);

  return useMutation({
    mutationFn: async ({
      reviewId,
      liked,
    }: {
      reviewId: string;
      liked: boolean | null;
    }) => {
      return updateMutation.mutateAsync({
        reviewId,
        updates: { liked },
      });
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
