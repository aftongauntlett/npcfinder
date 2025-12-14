/**
 * TanStack Query hooks for Watchlist
 * Provides optimistic updates with proper error handling and rollback
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";
import { parseSupabaseError } from "../utils/errorUtils";
import { fetchMultipleMediaDetails, type DetailedMediaInfo } from "../utils/tmdbDetails";
import {
  getCachedMediaDetailsBatch,
  upsertCachedMediaDetails,
} from "@/services/mediaDetailsCacheService";
import { logger } from "@/lib/logger";
import type {
  WatchlistItem,
  AddWatchlistItemData,
} from "../services/recommendationsService.types";

/**
 * Get user's watchlist
 * Automatically refetches on window focus and manages cache
 */
export function useWatchlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.watchlist.list(user?.id),
    queryFn: async () => {
      try {
        return await recommendationsService.getWatchlist();
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (formerly cacheTime)
    enabled: !!user, // Only fetch if user is authenticated
  });
}

/**
 * Add item to watchlist
 * Uses optimistic updates with rollback on error
 */
export function useAddToWatchlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: AddWatchlistItemData) => {
      try {
        return await recommendationsService.addToWatchlist(itemData);
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    // Optimistic update: Add item immediately to UI
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });

      // Snapshot the previous value
      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(user?.id)
      );

      // Optimistically update with temporary ID
      if (previousWatchlist) {
        const optimisticItem: WatchlistItem = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: "", // Will be set by server
          external_id: newItem.external_id,
          media_type: newItem.media_type,
          title: newItem.title,
          poster_url: newItem.poster_url || null,
          release_date: newItem.release_date || null,
          overview: newItem.overview || null,
          director: newItem.director || null,
          cast_members: newItem.cast_members || null,
          genres: newItem.genres || null,
          vote_average: newItem.vote_average || null,
          vote_count: newItem.vote_count || null,
          runtime: newItem.runtime || null,
          watched: newItem.watched || false, // Use the watched value from newItem
          list_order: null,
          notes: newItem.notes || null,
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          watched_at: newItem.watched ? new Date().toISOString() : null, // Set watched_at if already watched
        };

        queryClient.setQueryData<WatchlistItem[]>(
          queryKeys.watchlist.list(user?.id),
          [optimisticItem, ...previousWatchlist]
        );
      }

      // Return context object with the snapshot
      return { previousWatchlist };
    },

    // On error: rollback to previous state
    onError: (_err, _newItem, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(
          queryKeys.watchlist.list(user?.id),
          context.previousWatchlist
        );
      }
    },

    // On success: replace optimistic item with real data
    onSuccess: (data) => {
      queryClient.setQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(user?.id),
        (old) => {
          if (!old) return [data];
          // Replace temporary item with real data from server
          return [data, ...old.filter((item) => !item.id.startsWith("temp-"))];
        }
      );
    },

    // Always refetch after error or success to ensure sync
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });
    },
  });
}

/**
 * Toggle watched status
 * Uses optimistic updates with rollback on error
 */
export function useToggleWatchlistWatched() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await recommendationsService.toggleWatchlistWatched(id);
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    // Optimistic update: Toggle watched status immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(user?.id)
      );

      // Optimistically update watched status
      if (previousWatchlist) {
        queryClient.setQueryData<WatchlistItem[]>(
          queryKeys.watchlist.list(user?.id),
          previousWatchlist.map((item) =>
            item.id === id
              ? {
                  ...item,
                  watched: !item.watched,
                  watched_at: !item.watched ? new Date().toISOString() : null,
                }
              : item
          )
        );
      }

      return { previousWatchlist };
    },

    onError: (_err, _id, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(
          queryKeys.watchlist.list(user?.id),
          context.previousWatchlist
        );
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with updated data
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });
    },
  });
}

/**
 * Update watchlist item notes
 */
export function useUpdateWatchlistNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      try {
        return await recommendationsService.updateWatchlistItem(id, { notes });
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    onMutate: async ({ id, notes }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(user?.id)
      );

      if (previousWatchlist) {
        queryClient.setQueryData<WatchlistItem[]>(
          queryKeys.watchlist.list(user?.id),
          previousWatchlist.map((item) =>
            item.id === id ? { ...item, notes } : item
          )
        );
      }

      return { previousWatchlist };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(
          queryKeys.watchlist.list(user?.id),
          context.previousWatchlist
        );
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(user?.id),
        (old) => {
          if (!old) return [data];
          return old.map((item) => (item.id === data.id ? data : item));
        }
      );
    },
  });
}

/**
 * Delete item from watchlist
 * Uses optimistic updates with rollback on error
 */
export function useDeleteFromWatchlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await recommendationsService.deleteFromWatchlist(id);
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    // Optimistic update: Remove item immediately from UI
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(user?.id)
      );

      // Optimistically remove the item
      if (previousWatchlist) {
        queryClient.setQueryData<WatchlistItem[]>(
          queryKeys.watchlist.list(user?.id),
          previousWatchlist.filter((item) => item.id !== id)
        );
      }

      return { previousWatchlist };
    },

    // On error: rollback to previous state
    onError: (_err, _id, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(
          queryKeys.watchlist.list(user?.id),
          context.previousWatchlist
        );
      }
    },

    // On success: ensure the item is removed (should already be gone from optimistic update)
    onSuccess: (_, id) => {
      queryClient.setQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(user?.id),
        (old) => {
          if (!old) return [];
          return old.filter((item) => item.id !== id);
        }
      );
    },

    // Always refetch after error or success to ensure database is source of truth
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlist.list(user?.id),
      });
    },
  });
}

/**
 * Check if item is in watchlist
 * Uses cached watchlist data to avoid redundant Supabase calls
 */
export function useIsInWatchlist(external_id: string | null) {
  const { data: watchlist = [], isLoading, error } = useWatchlist();

  // Compute derived boolean by checking if external_id exists in the cached watchlist
  const isInWatchlist = external_id
    ? watchlist.some((item) => item.external_id === external_id)
    : false;

  return {
    data: isInWatchlist,
    isLoading,
    error,
  };
}

/**
 * Get a Set of external IDs in the watchlist for efficient lookups
 * Use this when checking many items to avoid repeated Array.prototype.some scans
 * 
 * @example
 * const watchlistIds = useWatchlistIds();
 * const isInWatchlist = watchlistIds.has(external_id);
 */
export function useWatchlistIds() {
  const { data: watchlist = [] } = useWatchlist();

  return useMemo(() => {
    return new Set(watchlist.map((item) => item.external_id));
  }, [watchlist]);
}

export function usePrefetchWatchlistDetails(
  items: Array<{ external_id: string; media_type: "movie" | "tv" }>,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    let cancelled = false;

    const uncached = items.filter((item) => {
      const key = queryKeys.watchlist.details(item.external_id, item.media_type);
      return !queryClient.getQueryData<DetailedMediaInfo>(key);
    });

    if (uncached.length === 0) return;

    void (async () => {
      try {
        // 1) Hydrate from Supabase cache first (fast, shared)
        const cached = await getCachedMediaDetailsBatch(uncached);
        if (cancelled) return;

        const remaining: typeof uncached = [];
        uncached.forEach((item) => {
          const cachedDetails = cached.get(`${item.external_id}:${item.media_type}`);
          if (cachedDetails) {
            queryClient.setQueryData(
              queryKeys.watchlist.details(item.external_id, item.media_type),
              cachedDetails
            );
          } else {
            remaining.push(item);
          }
        });

        // 2) Fill any misses via external APIs (rate limiters apply)
        if (remaining.length === 0) return;

        const fetched = await fetchMultipleMediaDetails(remaining);
        if (cancelled) return;

        fetched.forEach((details, externalId) => {
          queryClient.setQueryData(
            queryKeys.watchlist.details(externalId, details.media_type),
            details
          );

          // 3) Persist to Supabase cache (fire-and-forget)
          void upsertCachedMediaDetails(details);
        });
      } catch (error) {
        logger.warn("Failed to prefetch watchlist details", { error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, items, queryClient]);
}
