/**
 * Generic Recommendations Hooks
 * Provides reusable React Query hooks for any media type
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";

type MediaTypeKey = "movies-tv" | "song" | "music";

/**
 * Generic hook to get friends who have sent recommendations
 */
export function useFriendsWithRecs(mediaTypeKey: MediaTypeKey) {
  // Map mediaTypeKey to service parameter
  const mediaType =
    mediaTypeKey === "movies-tv"
      ? undefined
      : mediaTypeKey === "music"
      ? "song"
      : mediaTypeKey;

  return useQuery({
    queryKey: queryKeys.friends.withRecs(mediaTypeKey),
    queryFn: () =>
      recommendationsService.getFriendsWithRecommendations(
        mediaType as "song" | "album" | "movie" | "tv" | undefined
      ),
  });
}

/**
 * Generic hook to get quick stats
 */
export function useQuickStats(mediaTypeKey: MediaTypeKey) {
  // Map mediaTypeKey to service parameter
  const mediaType =
    mediaTypeKey === "movies-tv"
      ? undefined
      : mediaTypeKey === "music"
      ? "song"
      : mediaTypeKey;

  return useQuery({
    queryKey: queryKeys.stats.quick(mediaTypeKey),
    queryFn: () =>
      recommendationsService.getQuickStats(
        mediaType as "song" | "album" | "movie" | "tv" | undefined
      ),
  });
}

/**
 * Generic hook to get recommendations with filters
 */
export function useRecommendations(
  view: string,
  friendId: string | undefined,
  mediaTypeKey: MediaTypeKey
) {
  // Map mediaTypeKey to service parameter
  const mediaType =
    mediaTypeKey === "movies-tv"
      ? undefined
      : mediaTypeKey === "music"
      ? "song"
      : mediaTypeKey;

  return useQuery({
    queryKey: queryKeys.recommendations.byMedia(view, friendId, mediaTypeKey),
    queryFn: async () => {
      if (view === "overview") {
        return [];
      }

      if (view === "friend" && friendId) {
        return recommendationsService.getRecommendationsFromFriend(
          friendId,
          mediaType as "song" | "album" | "movie" | "tv" | undefined
        );
      }

      if (view === "queue") {
        // Fetch all pending recommendations (for friend grouping)
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "pending",
          mediaType:
            mediaTypeKey === "music"
              ? "song"
              : mediaTypeKey === "movies-tv"
              ? undefined
              : (mediaTypeKey as "song" | "album" | "movie" | "tv"),
        });
      }

      if (view === "hits") {
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "hit",
          mediaType:
            mediaTypeKey === "music"
              ? "song"
              : mediaTypeKey === "movies-tv"
              ? undefined
              : (mediaTypeKey as "song" | "album" | "movie" | "tv"),
        });
      }

      if (view === "misses") {
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "miss",
          mediaType:
            mediaTypeKey === "music"
              ? "song"
              : mediaTypeKey === "movies-tv"
              ? undefined
              : (mediaTypeKey as "song" | "album" | "movie" | "tv"),
        });
      }

      if (view === "sent") {
        return recommendationsService.getRecommendations({
          direction: "sent",
          mediaType:
            mediaTypeKey === "music"
              ? "song"
              : mediaTypeKey === "movies-tv"
              ? undefined
              : (mediaTypeKey as "song" | "album" | "movie" | "tv"),
        });
      }

      return [];
    },
    enabled: view !== "overview", // Don't fetch for overview
  });
}

/**
 * Generic mutation to update recommendation status
 */
export function useUpdateStatus(mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recId,
      status,
      mediaType,
    }: {
      recId: string;
      status: string;
      mediaType?: "movie" | "tv" | "song" | "album";
    }) => {
      // Use passed mediaType or default based on mediaTypeKey
      const finalMediaType =
        mediaType ||
        (mediaTypeKey === "movies-tv"
          ? "movie"
          : mediaTypeKey === "music"
          ? "song"
          : (mediaTypeKey as "movie" | "tv" | "song" | "album"));

      return recommendationsService.updateRecommendationStatus(
        recId,
        status as "pending" | "consumed" | "hit" | "miss",
        finalMediaType
      );
    },
    onSuccess: () => {
      // Invalidate all related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Generic mutation to delete a recommendation
 */
export function useDeleteRec(_mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recId: string) =>
      recommendationsService.deleteRecommendation(recId),
    onSuccess: () => {
      // Invalidate all related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Generic mutation to update sender's note
 */
export function useUpdateSenderNote(_mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recId, note }: { recId: string; note: string }) =>
      recommendationsService.updateSenderNote(recId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Generic mutation to update recipient's note
 */
export function useUpdateRecipientNote(_mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recId, note }: { recId: string; note: string }) =>
      recommendationsService.updateRecipientNote(recId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Generic mutation to mark all pending recommendations as opened
 */
export function useMarkRecommendationsAsOpened(_mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recommendationsService.markAllPendingAsOpened(),
    onSuccess: () => {
      // Invalidate dashboard stats to update badge count
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
      // Invalidate recommendations to refresh opened_at timestamps
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}
