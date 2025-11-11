/**
 * Generic Recommendations Hooks
 * Provides reusable React Query hooks for any media type
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Re-export wrapper allows swapping with mock for tests
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";
import type { Recommendation } from "../services/recommendationsService.types";

type MediaTypeKey = "movies-tv" | "music" | "books" | "games";
export type RecommendationView =
  | "overview"
  | "queue"
  | "hits"
  | "misses"
  | "sent"
  | "friend";

/**
 * Helper to map media type key to table name
 */
function tableFor(
  mediaTypeKey: MediaTypeKey
):
  | "movie_recommendations"
  | "music_recommendations"
  | "book_recommendations"
  | "game_recommendations" {
  if (mediaTypeKey === "movies-tv") {
    return "movie_recommendations";
  } else if (mediaTypeKey === "music") {
    return "music_recommendations";
  } else if (mediaTypeKey === "books") {
    return "book_recommendations";
  } else if (mediaTypeKey === "games") {
    return "game_recommendations";
  } else {
    return "movie_recommendations"; // fallback
  }
}

/**
 * Helper to cast service response to typed array
 */
const asArray = <U>(p: Promise<unknown>) => p.then((res) => res as U[]);

/**
 * Generic hook to get friends who have sent recommendations
 */
export function useFriendsWithRecs(mediaTypeKey: MediaTypeKey) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.friends.withRecs(mediaTypeKey),
    queryFn: () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Books and Games use separate functions
      if (mediaTypeKey === "books") {
        return recommendationsService.getFriendsWithBookRecommendations(
          user.id
        );
      }

      if (mediaTypeKey === "games") {
        return recommendationsService.getFriendsWithGameRecommendations(
          user.id
        );
      }

      // Map mediaTypeKey to service parameter for movies/music
      // undefined includes all types: movies-tv gets both movie & tv, music gets both song & album
      const mediaType = undefined;

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

      // Books and Games use separate functions
      if (mediaTypeKey === "books") {
        return recommendationsService.getBookQuickStats(user.id);
      }

      if (mediaTypeKey === "games") {
        return recommendationsService.getGameQuickStats(user.id);
      }

      // Map mediaTypeKey to service parameter for movies/music
      // undefined includes all types: movies-tv gets both movie & tv, music gets both song & album
      const mediaType = undefined;

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
 * @template T - Recommendation type (e.g., MusicRecommendation, MovieRecommendation)
 */
export function useRecommendations<T = Recommendation>(
  view: RecommendationView,
  friendId: string | undefined,
  mediaTypeKey: MediaTypeKey
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.recommendations.byMedia(view, friendId, mediaTypeKey),
    queryFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      if (view === "overview") {
        return [] as T[];
      }

      // Books use separate service functions
      if (mediaTypeKey === "books") {
        if (view === "friend" && friendId) {
          return asArray<T>(
            recommendationsService.getBookRecommendationsFromFriend(
              user.id,
              friendId
            )
          );
        }
        if (view === "queue") {
          return asArray<T>(
            recommendationsService.getBookRecommendations(user.id, {
              direction: "received",
              status: "pending",
            })
          );
        }
        if (view === "hits") {
          return asArray<T>(
            recommendationsService.getBookRecommendations(user.id, {
              direction: "received",
              status: "hit",
            })
          );
        }
        if (view === "misses") {
          return asArray<T>(
            recommendationsService.getBookRecommendations(user.id, {
              direction: "received",
              status: "miss",
            })
          );
        }
        if (view === "sent") {
          return asArray<T>(
            recommendationsService.getBookRecommendations(user.id, {
              direction: "sent",
            })
          );
        }
        return [] as T[];
      }

      // Games use separate service functions
      if (mediaTypeKey === "games") {
        if (view === "friend" && friendId) {
          return asArray<T>(
            recommendationsService.getGameRecommendationsFromFriend(
              user.id,
              friendId
            )
          );
        }
        if (view === "queue") {
          return asArray<T>(
            recommendationsService.getGameRecommendations(user.id, {
              direction: "received",
              status: "pending",
            })
          );
        }
        if (view === "hits") {
          return asArray<T>(
            recommendationsService.getGameRecommendations(user.id, {
              direction: "received",
              status: "hit",
            })
          );
        }
        if (view === "misses") {
          return asArray<T>(
            recommendationsService.getGameRecommendations(user.id, {
              direction: "received",
              status: "miss",
            })
          );
        }
        if (view === "sent") {
          return asArray<T>(
            recommendationsService.getGameRecommendations(user.id, {
              direction: "sent",
            })
          );
        }
        return [] as T[];
      }

      // Movies/Music use the original service functions
      // undefined includes all types: movies-tv gets both movie & tv, music gets both song & album
      const mediaType = undefined;

      if (view === "friend" && friendId) {
        return asArray<T>(
          recommendationsService.getRecommendationsFromFriend(
            user.id,
            friendId,
            mediaType as "song" | "album" | "movie" | "tv" | undefined
          )
        );
      }

      if (view === "queue") {
        return asArray<T>(
          recommendationsService.getRecommendations(user.id, {
            direction: "received",
            status: "pending",
            mediaType: mediaType as
              | "song"
              | "album"
              | "movie"
              | "tv"
              | undefined,
          })
        );
      }

      if (view === "hits") {
        return asArray<T>(
          recommendationsService.getRecommendations(user.id, {
            direction: "received",
            status: "hit",
            mediaType: mediaType as
              | "song"
              | "album"
              | "movie"
              | "tv"
              | undefined,
          })
        );
      }

      if (view === "misses") {
        return asArray<T>(
          recommendationsService.getRecommendations(user.id, {
            direction: "received",
            status: "miss",
            mediaType: mediaType as
              | "song"
              | "album"
              | "movie"
              | "tv"
              | undefined,
          })
        );
      }

      if (view === "sent") {
        return asArray<T>(
          recommendationsService.getRecommendations(user.id, {
            direction: "sent",
            mediaType: mediaType as
              | "song"
              | "album"
              | "movie"
              | "tv"
              | undefined,
          })
        );
      }

      return [] as T[];
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
      return recommendationsService.updateRecommendationStatus(
        recId,
        status as "pending" | "consumed" | "hit" | "miss",
        tableFor(mediaTypeKey)
      );
    },
    onSuccess: () => {
      // Invalidate specific queries for this media type
      void queryClient.invalidateQueries({
        queryKey: queryKeys.friends.withRecs(mediaTypeKey),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stats.quick(mediaTypeKey),
      });
      // Invalidate only recommendation queries for this media type
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "recommendations" && key.includes(mediaTypeKey);
        },
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
      return recommendationsService.deleteRecommendation(
        recId,
        tableFor(mediaTypeKey)
      );
    },
    onSuccess: () => {
      // Invalidate specific queries for this media type
      void queryClient.invalidateQueries({
        queryKey: queryKeys.friends.withRecs(mediaTypeKey),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stats.quick(mediaTypeKey),
      });
      // Invalidate only recommendation queries for this media type
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "recommendations" && key.includes(mediaTypeKey);
        },
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
      return recommendationsService.updateSenderNote(
        recId,
        note,
        tableFor(mediaTypeKey)
      );
    },
    onSuccess: () => {
      // Invalidate only recommendation queries for this media type
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "recommendations" && key.includes(mediaTypeKey);
        },
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
      return recommendationsService.updateRecipientNote(
        recId,
        note,
        tableFor(mediaTypeKey)
      );
    },
    onSuccess: () => {
      // Invalidate only recommendation queries for this media type
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "recommendations" && key.includes(mediaTypeKey);
        },
      });
    },
  });
}

/**
 * Generic mutation to mark all pending recommendations as opened
 */
export function useMarkRecommendationsAsOpened(mediaTypeKey: MediaTypeKey) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Not authenticated");

      return recommendationsService.markAllPendingAsOpened(
        user.id,
        tableFor(mediaTypeKey)
      );
    },
    onSuccess: () => {
      // Invalidate dashboard stats to update badge count
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
      // Invalidate only recommendation queries for this media type
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "recommendations" && key.includes(mediaTypeKey);
        },
      });
    },
  });
}
