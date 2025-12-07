/**
 * Query Prefetch Utilities
 *
 * Strategic prefetching functions for navigation hover interactions.
 * Reduces perceived load times by preloading data before route navigation.
 *
 * Usage: Call from navigation component onMouseEnter handlers with debounce.
 * Each function prefetches the main queries for a specific page/feature.
 */

import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";

const PREFETCH_STALE_TIME = 1000 * 60 * 5; // Match main query staleTime (5 minutes)

/**
 * Prefetch Movies/TV data
 * Loads: watchlist, recommendations overview
 */
export const prefetchMoviesData = async (
  queryClient: QueryClient,
  userId?: string
) => {
  if (!userId || typeof window === "undefined") return;

  // Skip if cache is fresh
  const watchlistCached = queryClient.getQueryState(
    queryKeys.watchlist.list(userId)
  );
  if (
    watchlistCached?.dataUpdatedAt &&
    Date.now() - watchlistCached.dataUpdatedAt < PREFETCH_STALE_TIME
  ) {
    return;
  }

  // Import dynamically to avoid circular deps
  const recommendationsService = await import(
    "../services/recommendationsService"
  );

  // Prefetch watchlist - matches useWatchlist hook exactly
  await queryClient.prefetchQuery({
    queryKey: queryKeys.watchlist.list(userId),
    queryFn: () => recommendationsService.getWatchlist(),
    staleTime: PREFETCH_STALE_TIME,
  });

  // Prefetch recommendations overview - matches useRecommendationsByMedia hook
  await queryClient.prefetchQuery({
    queryKey: queryKeys.recommendations.byMedia(
      "overview",
      undefined,
      "movies-tv"
    ),
    queryFn: () => {
      return recommendationsService.getRecommendations(userId, {
        direction: "received",
        mediaType: undefined, // undefined includes both movie & tv
      });
    },
    staleTime: PREFETCH_STALE_TIME,
  });
};

/**
 * Prefetch Tasks data
 * Loads: boards with stats, today's tasks
 */
export const prefetchTasksData = async (
  queryClient: QueryClient,
  userId?: string
) => {
  if (!userId || typeof window === "undefined") return;

  // Skip if cache is fresh
  const cached = queryClient.getQueryState(queryKeys.tasks.boards(userId));
  if (
    cached?.dataUpdatedAt &&
    Date.now() - cached.dataUpdatedAt < PREFETCH_STALE_TIME
  ) {
    return;
  }

  // Import dynamically to avoid circular deps
  const tasksService = await import("../services/tasksService");

  // Prefetch boards with stats - matches useBoards hook exactly
  await queryClient.prefetchQuery({
    queryKey: queryKeys.tasks.boards(userId),
    queryFn: async () => {
      const { data, error } = await tasksService.getBoardsWithStats();
      if (error) throw error;
      return data || [];
    },
    staleTime: PREFETCH_STALE_TIME,
  });
};

/**
 * Prefetch Books data
 * Loads: reading list, book recommendations
 */
export const prefetchBooksData = async (
  queryClient: QueryClient,
  userId?: string
) => {
  if (!userId || typeof window === "undefined") return;

  // Skip if cache is fresh
  const cached = queryClient.getQueryState(queryKeys.readingList.list(userId));
  if (
    cached?.dataUpdatedAt &&
    Date.now() - cached.dataUpdatedAt < PREFETCH_STALE_TIME
  ) {
    return;
  }

  // Prefetch reading list - matches useReadingList hook
  await queryClient.prefetchQuery({
    queryKey: queryKeys.readingList.list(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_list")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: PREFETCH_STALE_TIME,
  });
};

/**
 * Prefetch Games data
 * Loads: game library, game recommendations
 */
export const prefetchGamesData = async (
  queryClient: QueryClient,
  userId?: string
) => {
  if (!userId || typeof window === "undefined") return;

  // Skip if cache is fresh
  const cached = queryClient.getQueryState(queryKeys.gameLibrary.list(userId));
  if (
    cached?.dataUpdatedAt &&
    Date.now() - cached.dataUpdatedAt < PREFETCH_STALE_TIME
  ) {
    return;
  }

  // Prefetch game library - matches useGameLibrary hook
  await queryClient.prefetchQuery({
    queryKey: queryKeys.gameLibrary.list(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_library")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: PREFETCH_STALE_TIME,
  });
};

/**
 * Prefetch Music data
 * Loads: music library
 */
export const prefetchMusicData = async (
  queryClient: QueryClient,
  userId?: string
) => {
  if (!userId || typeof window === "undefined") return;

  // Skip if cache is fresh
  const cached = queryClient.getQueryState(queryKeys.musicLibrary.list(userId));
  if (
    cached?.dataUpdatedAt &&
    Date.now() - cached.dataUpdatedAt < PREFETCH_STALE_TIME
  ) {
    return;
  }

  // Prefetch music library - matches useMusicLibrary hook
  await queryClient.prefetchQuery({
    queryKey: queryKeys.musicLibrary.list(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_library")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: PREFETCH_STALE_TIME,
  });
};

/**
 * Debounced prefetch wrapper
 * Prevents excessive prefetching on rapid hover events
 *
 * @param prefetchFn - The prefetch function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 */
export const debouncedPrefetch = (
  prefetchFn: () => Promise<void>,
  delay: number = 300
): (() => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      void prefetchFn();
      timeoutId = null;
    }, delay);
  };
};
