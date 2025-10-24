/**
 * Generic Recommendations Hooks
 * Provides reusable React Query hooks for any media type
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";

type MediaTypeKey = "movies-tv" | "song" | "music" | "books";

/**
 * Generic hook to get friends who have sent recommendations
 */
export function useFriendsWithRecs(mediaTypeKey: MediaTypeKey) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.friends.withRecs(mediaTypeKey),
    queryFn: () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Books use separate functions
      if (mediaTypeKey === "books") {
        return recommendationsService.getFriendsWithBookRecommendations(
          user.id
        );
      }

      // Map mediaTypeKey to service parameter for movies/music
      const mediaType =
        mediaTypeKey === "movies-tv"
          ? undefined
          : mediaTypeKey === "music"
          ? "song"
          : undefined;

      return recommendationsService.getFriendsWithRecommendations(
        user.id,
        mediaType as "song" | "album" | "movie" | "tv" | undefined
      );
    },
    enabled: !!user?.id,
  });
}

/**
 * Generic hook to get quick stats
 */
export function useQuickStats(mediaTypeKey: MediaTypeKey) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.stats.quick(mediaTypeKey),
    queryFn: () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Books use separate functions
      if (mediaTypeKey === "books") {
        return recommendationsService.getBookQuickStats(user.id);
      }

      // Map mediaTypeKey to service parameter for movies/music
      const mediaType =
        mediaTypeKey === "movies-tv"
          ? undefined
          : mediaTypeKey === "music"
          ? "song"
          : undefined;

      return recommendationsService.getQuickStats(
        user.id,
        mediaType as "song" | "album" | "movie" | "tv" | undefined
      );
    },
    enabled: !!user?.id,
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
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.recommendations.byMedia(view, friendId, mediaTypeKey),
    queryFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      if (view === "overview") {
        return [];
      }

      // Books use separate service functions
      if (mediaTypeKey === "books") {
        if (view === "friend" && friendId) {
          return recommendationsService.getBookRecommendationsFromFriend(
            user.id,
            friendId
          );
        }
        if (view === "queue") {
          return recommendationsService.getBookRecommendations(user.id, {
            direction: "received",
            status: "pending",
          });
        }
        if (view === "hits") {
          return recommendationsService.getBookRecommendations(user.id, {
            direction: "received",
            status: "hit",
          });
        }
        if (view === "misses") {
          return recommendationsService.getBookRecommendations(user.id, {
            direction: "received",
            status: "miss",
          });
        }
        if (view === "sent") {
          return recommendationsService.getBookRecommendations(user.id, {
            direction: "sent",
          });
        }
        return [];
      }

      // Movies/Music use the original service functions
      const mediaType =
        mediaTypeKey === "movies-tv"
          ? undefined
          : mediaTypeKey === "music"
          ? "song"
          : undefined;

      if (view === "friend" && friendId) {
        return recommendationsService.getRecommendationsFromFriend(
          user.id,
          friendId,
          mediaType as "song" | "album" | "movie" | "tv" | undefined
        );
      }

      if (view === "queue") {
        return recommendationsService.getRecommendations(user.id, {
          direction: "received",
          status: "pending",
          mediaType: mediaType as "song" | "album" | "movie" | "tv" | undefined,
        });
      }

      if (view === "hits") {
        return recommendationsService.getRecommendations(user.id, {
          direction: "received",
          status: "hit",
          mediaType: mediaType as "song" | "album" | "movie" | "tv" | undefined,
        });
      }

      if (view === "misses") {
        return recommendationsService.getRecommendations(user.id, {
          direction: "received",
          status: "miss",
          mediaType: mediaType as "song" | "album" | "movie" | "tv" | undefined,
        });
      }

      if (view === "sent") {
        return recommendationsService.getRecommendations(user.id, {
          direction: "sent",
          mediaType: mediaType as "song" | "album" | "movie" | "tv" | undefined,
        });
      }

      return [];
    },
    enabled: view !== "overview" && !!user?.id, // Don't fetch for overview or if not authenticated
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
    }: {
      recId: string;
      status: string;
      mediaType?: "movie" | "tv" | "song" | "album";
    }) => {
      // Map media type to table name
      let tableName:
        | "movie_recommendations"
        | "music_recommendations"
        | "book_recommendations";
      if (mediaTypeKey === "movies-tv") {
        tableName = "movie_recommendations";
      } else if (mediaTypeKey === "music" || mediaTypeKey === "song") {
        tableName = "music_recommendations";
      } else if (mediaTypeKey === "books") {
        tableName = "book_recommendations";
      } else {
        tableName = "movie_recommendations"; // fallback
      }

      return recommendationsService.updateRecommendationStatus(
        recId,
        status as "pending" | "consumed" | "hit" | "miss",
        tableName
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
export function useDeleteRec(mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recId: string) => {
      // Map media type to table name
      let tableName:
        | "movie_recommendations"
        | "music_recommendations"
        | "book_recommendations";
      if (mediaTypeKey === "movies-tv") {
        tableName = "movie_recommendations";
      } else if (mediaTypeKey === "music" || mediaTypeKey === "song") {
        tableName = "music_recommendations";
      } else if (mediaTypeKey === "books") {
        tableName = "book_recommendations";
      } else {
        tableName = "movie_recommendations"; // fallback
      }

      return recommendationsService.deleteRecommendation(recId, tableName);
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
 * Generic mutation to update sender's note
 */
export function useUpdateSenderNote(mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recId, note }: { recId: string; note: string }) => {
      // Map media type to table name
      let tableName:
        | "movie_recommendations"
        | "music_recommendations"
        | "book_recommendations";
      if (mediaTypeKey === "movies-tv") {
        tableName = "movie_recommendations";
      } else if (mediaTypeKey === "music" || mediaTypeKey === "song") {
        tableName = "music_recommendations";
      } else if (mediaTypeKey === "books") {
        tableName = "book_recommendations";
      } else {
        tableName = "movie_recommendations"; // fallback
      }

      return recommendationsService.updateSenderNote(recId, note, tableName);
    },
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
export function useUpdateRecipientNote(mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recId, note }: { recId: string; note: string }) => {
      // Map media type to table name
      let tableName:
        | "movie_recommendations"
        | "music_recommendations"
        | "book_recommendations";
      if (mediaTypeKey === "movies-tv") {
        tableName = "movie_recommendations";
      } else if (mediaTypeKey === "music" || mediaTypeKey === "song") {
        tableName = "music_recommendations";
      } else if (mediaTypeKey === "books") {
        tableName = "book_recommendations";
      } else {
        tableName = "movie_recommendations"; // fallback
      }

      return recommendationsService.updateRecipientNote(recId, note, tableName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    },
  });
}

/**
 * Generic mutation to mark all pending recommendations as opened
 * Note: This function doesn't exist in the service, removing it for now
 */
export function useMarkRecommendationsAsOpened(_mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      // TODO: Implement this function in the service if needed
      return Promise.reject(
        new Error("markAllPendingAsOpened is not implemented")
      );
    },
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
