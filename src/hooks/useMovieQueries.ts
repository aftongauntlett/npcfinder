/**
 * TanStack Query hooks for Movies & TV page
 * Replaces manual useEffect/useState patterns with declarative queries
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";

/**
 * Get friends who have sent movie/TV recommendations
 */
export function useFriendsWithMovieRecs() {
  return useQuery({
    queryKey: queryKeys.friends.withRecs("movie"),
    queryFn: () =>
      recommendationsService.getFriendsWithRecommendations("movie"),
  });
}

/**
 * Get quick stats for movies/TV
 */
export function useMovieStats() {
  return useQuery({
    queryKey: queryKeys.stats.quick("movie"),
    queryFn: () => recommendationsService.getQuickStats("movie"),
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
        return recommendationsService.getRecommendationsFromFriend(
          friendId,
          "movie"
        );
      }

      if (view === "hits") {
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "hit",
          mediaType: "movie",
        });
      }

      if (view === "misses") {
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "miss",
          mediaType: "movie",
        });
      }

      if (view === "sent") {
        return recommendationsService.getRecommendations({
          direction: "sent",
          mediaType: "movie",
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
