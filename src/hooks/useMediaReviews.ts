/**
 * TanStack Query hooks for Media Reviews
 * Provides optimistic updates with proper error handling and rollback
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { queryKeys } from "../lib/queryKeys";
import { logger } from "../lib/logger";
import * as reviewsService from "../services/reviewsService";
import type {
  MediaReview,
  CreateReviewData,
  UpdateReviewData,
} from "../services/reviewsService.types";

/**
 * Get the current user's review for a specific media item
 */
export function useMyReview(externalId: string, mediaType: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.reviews.my(externalId, mediaType),
    queryFn: () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return reviewsService.getMyReview(user.id, externalId, mediaType);
    },
    enabled: !!user?.id && !!externalId && !!mediaType,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

/**
 * Get friends' public reviews for a specific media item
 */
export function useFriendsReviews(externalId: string, mediaType: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.reviews.friends(externalId, mediaType),
    queryFn: () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return reviewsService.getFriendsReviews(user.id, externalId, mediaType);
    },
    enabled: !!user?.id && !!externalId && !!mediaType,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

/**
 * Create a new review
 * Uses optimistic updates with rollback on error
 */
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: CreateReviewData) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return reviewsService.createReview(data);
    },

    // Optimistic update: Add review immediately to UI
    onMutate: async (newReview) => {
      const myReviewKey = queryKeys.reviews.my(
        newReview.external_id,
        newReview.media_type
      );

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: myReviewKey });

      // Snapshot the previous value
      const previousReview = queryClient.getQueryData<MediaReview | null>(
        myReviewKey
      );

      // Optimistically update with temporary data
      const optimisticReview: MediaReview = {
        id: `temp-${Date.now()}`,
        user_id: newReview.user_id,
        external_id: newReview.external_id,
        media_type: newReview.media_type,
        title: newReview.title,
        rating: newReview.rating ?? null,
        review_text: newReview.review_text ?? null,
        is_public: newReview.is_public ?? true,
        watched_at: newReview.watched_at ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        edited_at: null,
      };

      queryClient.setQueryData<MediaReview>(myReviewKey, optimisticReview);

      return { previousReview, myReviewKey };
    },

    // On error, rollback to previous state
    onError: (error, _newReview, context) => {
      logger.error("Error creating review:", error);
      if (context) {
        queryClient.setQueryData(context.myReviewKey, context.previousReview);
      }
    },

    // On success, invalidate and refetch
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.my(
          variables.external_id,
          variables.media_type
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.friends(
          variables.external_id,
          variables.media_type
        ),
      });
    },
  });
}

/**
 * Update an existing review
 * Uses optimistic updates with rollback on error
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: string;
      externalId: string;
      mediaType: string;
      data: UpdateReviewData;
    }) => reviewsService.updateReview(reviewId, data),

    // Optimistic update: Update review immediately in UI
    onMutate: async ({ externalId, mediaType, data }) => {
      const myReviewKey = queryKeys.reviews.my(externalId, mediaType);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: myReviewKey });

      // Snapshot previous value
      const previousReview = queryClient.getQueryData<MediaReview | null>(
        myReviewKey
      );

      if (previousReview) {
        // Optimistically update
        const updatedReview: MediaReview = {
          ...previousReview,
          ...data,
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<MediaReview>(myReviewKey, updatedReview);

        return { previousReview, myReviewKey };
      }

      return null;
    },

    // On error, rollback
    onError: (error, _variables, context) => {
      logger.error("Error updating review:", error);
      if (context?.myReviewKey && context?.previousReview) {
        queryClient.setQueryData(context.myReviewKey, context.previousReview);
      }
    },

    // On success, invalidate queries
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.my(data.external_id, data.media_type),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.friends(data.external_id, data.media_type),
      });
    },
  });
}

/**
 * Delete a review
 * Uses optimistic updates with rollback on error
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
    }: {
      reviewId: string;
      externalId: string;
      mediaType: string;
    }) => reviewsService.deleteReview(reviewId),

    // Optimistic update: Remove review immediately from UI
    onMutate: async ({ externalId, mediaType }) => {
      const myReviewKey = queryKeys.reviews.my(externalId, mediaType);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: myReviewKey });

      // Snapshot previous value
      const previousReview = queryClient.getQueryData<MediaReview | null>(
        myReviewKey
      );

      if (previousReview) {
        queryClient.setQueryData<MediaReview | null>(myReviewKey, null);
        return { previousReview, myReviewKey, externalId, mediaType };
      }

      return null;
    },

    // On error, restore review
    onError: (error, _reviewId, context) => {
      logger.error("Error deleting review:", error);
      if (context?.myReviewKey && context?.previousReview) {
        queryClient.setQueryData(context.myReviewKey, context.previousReview);
      }
    },

    // On success, invalidate queries
    onSuccess: (_, _variables, context) => {
      if (context) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.reviews.my(context.externalId, context.mediaType),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.reviews.friends(
            context.externalId,
            context.mediaType
          ),
        });
      }
    },
  });
}

/**
 * Toggle review privacy
 * Quick helper that updates is_public field
 */
export function useToggleReviewPrivacy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      isPublic,
    }: {
      reviewId: string;
      externalId: string;
      mediaType: string;
      isPublic: boolean;
    }) => reviewsService.toggleReviewPrivacy(reviewId, isPublic),

    // Optimistic update
    onMutate: async ({ externalId, mediaType, isPublic }) => {
      const myReviewKey = queryKeys.reviews.my(externalId, mediaType);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: myReviewKey });

      // Snapshot previous value
      const previousReview = queryClient.getQueryData<MediaReview | null>(
        myReviewKey
      );

      if (previousReview) {
        const updatedReview: MediaReview = {
          ...previousReview,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<MediaReview>(myReviewKey, updatedReview);

        return { previousReview, myReviewKey, externalId, mediaType };
      }

      return null;
    },

    // On error, rollback
    onError: (error, _variables, context) => {
      logger.error("Error toggling review privacy:", error);
      if (context?.myReviewKey && context?.previousReview) {
        queryClient.setQueryData(context.myReviewKey, context.previousReview);
      }
    },

    // On success, invalidate friends' reviews (privacy affects their visibility)
    onSuccess: (_data, _variables, context) => {
      if (context) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.reviews.my(context.externalId, context.mediaType),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.reviews.friends(
            context.externalId,
            context.mediaType
          ),
        });
      }
    },
  });
}
