/**
 * TanStack Query hooks for Movies & TV page
 * Replaces manual useEffect/useState patterns with declarative queries
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";

/**
 * Get friends who have sent movie/TV recommendations
 * Note: Pass undefined to get BOTH movies and TV shows (they're in the same table)
 */
export function useFriendsWithMovieRecs() {
  return useQuery({
    queryKey: queryKeys.friends.withRecs("movies-tv"),
    queryFn: () =>
      recommendationsService.getFriendsWithRecommendations(undefined),
  });
}

/**
 * Get quick stats for movies/TV
 * Note: Pass undefined to get BOTH movies and TV shows (they're in the same table)
 */
export function useMovieStats() {
  return useQuery({
    queryKey: queryKeys.stats.quick("movies-tv"),
    queryFn: () => recommendationsService.getQuickStats(undefined),
  });
}

/**
 * Get movie/TV recommendations with filters
 */
export function useMovieRecommendations(view: string, friendId?: string) {
  return useQuery({
    queryKey: ["movie-recommendations", view, friendId],
    queryFn: async () => {
      if (view === "overview") {
        return [];
      }

      if (view === "friend" && friendId) {
        // Don't pass mediaType - fetch both movies AND TV shows
        return recommendationsService.getRecommendationsFromFriend(
          friendId,
          undefined
        );
      }

      if (view === "queue") {
        // Fetch all pending recommendations (for friend grouping)
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "pending",
        });
      }

      if (view === "hits") {
        // Don't pass mediaType - fetch both movies AND TV shows
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "hit",
        });
      }

      if (view === "misses") {
        // Don't pass mediaType - fetch both movies AND TV shows
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "miss",
        });
      }

      if (view === "sent") {
        // Don't pass mediaType - fetch both movies AND TV shows
        return recommendationsService.getRecommendations({
          direction: "sent",
        });
      }

      return [];
    },
    enabled: view !== "overview", // Don't fetch for overview
  });
}

/**
 * Update recommendation status mutation
 */
export function useUpdateMovieRecommendationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recId,
      status,
      mediaType = "movie",
    }: {
      recId: string;
      status: string;
      mediaType?: "movie" | "tv";
    }) =>
      recommendationsService.updateRecommendationStatus(
        recId,
        status as "pending" | "consumed" | "hit" | "miss",
        mediaType
      ),
    onSuccess: () => {
      // Invalidate all movie-related queries so both sender and receiver see updates
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      void queryClient.invalidateQueries({
        queryKey: ["movie-recommendations"],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Delete recommendation mutation
 */
export function useDeleteMovieRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recId: string) =>
      recommendationsService.deleteRecommendation(recId),
    onSuccess: () => {
      // Invalidate all movie-related queries so both sender and receiver see updates
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      void queryClient.invalidateQueries({
        queryKey: ["movie-recommendations"],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Update sender's note mutation
 */
export function useUpdateSenderNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recId, note }: { recId: string; note: string }) =>
      recommendationsService.updateSenderNote(recId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["movie-recommendations"],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Update recipient's note mutation
 */
export function useUpdateRecipientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recId, note }: { recId: string; note: string }) =>
      recommendationsService.updateRecipientNote(recId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["movie-recommendations"],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}
