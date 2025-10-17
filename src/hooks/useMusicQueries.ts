/**
 * TanStack Query hooks for Music page
 * Replaces manual useEffect/useState patterns with declarative queries
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";

/**
 * Get friends who have sent music recommendations
 */
export function useFriendsWithMusicRecs() {
  return useQuery({
    queryKey: queryKeys.friends.withRecs("song"),
    queryFn: () => recommendationsService.getFriendsWithRecommendations("song"),
  });
}

/**
 * Get quick stats for music
 */
export function useMusicStats() {
  return useQuery({
    queryKey: queryKeys.stats.quick("song"),
    queryFn: () => recommendationsService.getQuickStats("song"),
  });
}

/**
 * Get music recommendations with filters
 */
export function useMusicRecommendations(view: string, friendId?: string) {
  return useQuery({
    queryKey: ["music-recommendations", view, friendId],
    queryFn: async () => {
      if (view === "overview") {
        return [];
      }

      if (view === "friend" && friendId) {
        return recommendationsService.getRecommendationsFromFriend(
          friendId,
          "song"
        );
      }

      if (view === "hits") {
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "hit",
          mediaType: "song",
        });
      }

      if (view === "misses") {
        return recommendationsService.getRecommendations({
          direction: "received",
          status: "miss",
          mediaType: "song",
        });
      }

      if (view === "sent") {
        return recommendationsService.getRecommendations({
          direction: "sent",
          mediaType: "song",
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
export function useUpdateRecommendationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recId,
      status,
      comment,
    }: {
      recId: string;
      status: string;
      comment?: string;
    }) =>
      recommendationsService.updateRecommendationStatus(
        recId,
        status as "pending" | "consumed" | "hit" | "miss",
        comment
      ),
    onSuccess: () => {
      // Invalidate relevant queries to refetch fresh data
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      void queryClient.invalidateQueries({
        queryKey: ["music-recommendations"],
      });
    },
  });
}

/**
 * Delete recommendation mutation
 */
export function useDeleteRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recId: string) =>
      recommendationsService.deleteRecommendation(recId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      void queryClient.invalidateQueries({
        queryKey: ["music-recommendations"],
      });
    },
  });
}

/**
 * Update sender note mutation
 */
export function useUpdateSenderNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recId, note }: { recId: string; note: string }) =>
      recommendationsService.updateSenderNote(recId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["music-recommendations"],
      });
    },
  });
}
