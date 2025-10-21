/**
 * TanStack Query hooks for Watchlist
 * Provides optimistic updates with proper error handling and rollback
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as recommendationsService from "../services/recommendationsService";
import { queryKeys } from "../lib/queryKeys";
import type {
  WatchlistItem,
  AddWatchlistItemData,
} from "../services/recommendationsService";

/**
 * Get user's watchlist
 * Automatically refetches on window focus and manages cache
 */
export function useWatchlist() {
  return useQuery({
    queryKey: queryKeys.watchlist.list(),
    queryFn: () => recommendationsService.getWatchlist(),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (formerly cacheTime)
  });
}

/**
 * Add item to watchlist
 * Uses optimistic updates with rollback on error
 */
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemData: AddWatchlistItemData) =>
      recommendationsService.addToWatchlist(itemData),

    // Optimistic update: Add item immediately to UI
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(),
      });

      // Snapshot the previous value
      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list()
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
          watched: false,
          list_order: null,
          notes: newItem.notes || null,
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          watched_at: null,
        };

        queryClient.setQueryData<WatchlistItem[]>(queryKeys.watchlist.list(), [
          optimisticItem,
          ...previousWatchlist,
        ]);
      }

      // Return context object with the snapshot
      return { previousWatchlist };
    },

    // On error: rollback to previous state
    onError: (_err, _newItem, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(
          queryKeys.watchlist.list(),
          context.previousWatchlist
        );
      }
    },

    // On success: replace optimistic item with real data
    onSuccess: (data) => {
      queryClient.setQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(),
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
        queryKey: queryKeys.watchlist.list(),
      });
    },
  });
}

/**
 * Toggle watched status
 * Uses optimistic updates with rollback on error
 */
export function useToggleWatchlistWatched() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      recommendationsService.toggleWatchlistItemWatched(id),

    // Optimistic update: Toggle watched status immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(),
      });

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list()
      );

      // Optimistically update watched status
      if (previousWatchlist) {
        queryClient.setQueryData<WatchlistItem[]>(
          queryKeys.watchlist.list(),
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
          queryKeys.watchlist.list(),
          context.previousWatchlist
        );
      }
    },

    onSuccess: (data) => {
      // Update with real data from server
      queryClient.setQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(),
        (old) => {
          if (!old) return [data];
          return old.map((item) => (item.id === data.id ? data : item));
        }
      );
    },

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlist.list(),
      });
    },
  });
}

/**
 * Update watchlist item notes
 */
export function useUpdateWatchlistNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      recommendationsService.updateWatchlistNotes(id, notes),

    onMutate: async ({ id, notes }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(),
      });

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list()
      );

      if (previousWatchlist) {
        queryClient.setQueryData<WatchlistItem[]>(
          queryKeys.watchlist.list(),
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
          queryKeys.watchlist.list(),
          context.previousWatchlist
        );
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(),
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recommendationsService.deleteFromWatchlist(id),

    // Optimistic update: Remove item immediately from UI
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlist.list(),
      });

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list()
      );

      // Optimistically remove the item
      if (previousWatchlist) {
        queryClient.setQueryData<WatchlistItem[]>(
          queryKeys.watchlist.list(),
          previousWatchlist.filter((item) => item.id !== id)
        );
      }

      return { previousWatchlist };
    },

    // On error: rollback to previous state
    onError: (_err, _id, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(
          queryKeys.watchlist.list(),
          context.previousWatchlist
        );
      }
    },

    // On success: ensure the item is removed (should already be gone from optimistic update)
    onSuccess: (_, id) => {
      queryClient.setQueryData<WatchlistItem[]>(
        queryKeys.watchlist.list(),
        (old) => {
          if (!old) return [];
          return old.filter((item) => item.id !== id);
        }
      );
    },

    // Always refetch after error or success to ensure database is source of truth
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlist.list(),
      });
    },
  });
}

/**
 * Check if item is in watchlist
 */
export function useIsInWatchlist(external_id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.watchlist.all, "check", external_id],
    queryFn: () => {
      if (!external_id) return false;
      return recommendationsService.isInWatchlist(external_id);
    },
    enabled: !!external_id, // Only run query if external_id exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
