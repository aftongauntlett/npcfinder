import { useState, useMemo, useCallback, useEffect } from "react";
import type { WatchlistItem } from "../../services/recommendationsService.types";
import type { MediaItem } from "@/components/shared";
import {
  useWatchlist,
  useAddToWatchlist,
  useToggleWatchlistWatched,
  useDeleteFromWatchlist,
} from "../useWatchlistQueries";
import { useMediaFiltering } from "../useMediaFiltering";
import { useUrlPaginationState } from "../useUrlPaginationState";
import { fetchDetailedMediaInfo } from "../../utils/tmdbDetails";
import {
  getPersistedFilters,
  persistFilters,
} from "../../utils/persistenceUtils";
import {
  WATCHLIST_PERSISTENCE_KEY,
  WATCHLIST_DEFAULT_FILTERS,
  type MediaTypeFilter,
  type WatchlistSortType,
} from "../../data/watchlistFilters";
import { logger } from "@/lib/logger";

type FilterType = "all" | "to-watch" | "watched";

export interface UseWatchlistViewModelProps {
  initialFilter?: FilterType;
}

export function useWatchlistViewModel({
  initialFilter = "all",
}: UseWatchlistViewModelProps) {
  const { data: watchList = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const toggleWatched = useToggleWatchlistWatched();
  const deleteFromWatchlist = useDeleteFromWatchlist();

  // Load persisted filter state
  const persistedFilters = getPersistedFilters(
    WATCHLIST_PERSISTENCE_KEY,
    WATCHLIST_DEFAULT_FILTERS
  );

  // Filter state
  const [filter] = useState<FilterType>(initialFilter);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>(
    persistedFilters.mediaTypeFilter as MediaTypeFilter
  );
  const [genreFilters, setGenreFilters] = useState<string[]>(
    persistedFilters.genreFilters as string[]
  );
  const [sortBy, setSortBy] = useState<WatchlistSortType>(
    persistedFilters.sortBy as WatchlistSortType
  );

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [movieToRecommend, setMovieToRecommend] =
    useState<WatchlistItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WatchlistItem | null>(null);

  // Persist filter changes
  useEffect(() => {
    persistFilters(WATCHLIST_PERSISTENCE_KEY, {
      mediaTypeFilter,
      genreFilters,
      sortBy,
    });
  }, [mediaTypeFilter, genreFilters, sortBy]);

  // Extract unique genres from watchlist
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    watchList.forEach((item) => {
      if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach((genre) => {
          const trimmedGenre = genre.trim().toLowerCase();
          if (trimmedGenre) genreSet.add(trimmedGenre);
        });
      }
    });
    return genreSet;
  }, [watchList]);

  // Filter function based on current filter state
  const filterFn = useCallback(
    (item: WatchlistItem) => {
      // Filter by watched status
      if (filter === "to-watch" && item.watched) return false;
      if (filter === "watched" && !item.watched) return false;

      // Filter by media type
      if (mediaTypeFilter !== "all" && item.media_type !== mediaTypeFilter) {
        return false;
      }

      // Filter by genres (multiple selection support)
      if (genreFilters.length > 0 && !genreFilters.includes("all")) {
        if (!item.genres || item.genres.length === 0) return false;

        const itemGenres = item.genres.map((g) => g.trim().toLowerCase());
        const hasMatchingGenre = genreFilters.some((selectedGenre) =>
          itemGenres.includes(selectedGenre)
        );
        if (!hasMatchingGenre) return false;
      }

      return true;
    },
    [filter, mediaTypeFilter, genreFilters]
  );

  // Sort function based on current sort state
  const sortFn = useCallback(
    (a: WatchlistItem, b: WatchlistItem) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "year": {
          const yearA = a.release_date || "";
          const yearB = b.release_date || "";
          return yearB.localeCompare(yearA);
        }
        case "rating":
          // Placeholder for future rating sorting
          return 0;
        case "date-added":
        default:
          return (
            new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
          );
      }
    },
    [sortBy]
  );

  // URL-based pagination state
  const { page, perPage, setPage, setPerPage } = useUrlPaginationState(1, 10);

  // Use the filtering hook
  const {
    items: paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
  } = useMediaFiltering({
    items: watchList,
    filterFn,
    sortFn,
    initialPage: page,
    initialItemsPerPage: perPage,
    persistenceKey: WATCHLIST_PERSISTENCE_KEY,
    onPageChange: setPage,
    onItemsPerPageChange: setPerPage,
  });

  // Calculate counts for empty state logic
  const toWatchCount = useMemo(
    () => watchList.filter((item) => !item.watched).length,
    [watchList]
  );
  const watchedCount = useMemo(
    () => watchList.filter((item) => item.watched).length,
    [watchList]
  );

  const hasItemsForCurrentFilter =
    filter === "all"
      ? watchList.length > 0
      : filter === "to-watch"
      ? toWatchCount > 0
      : watchedCount > 0;

  // Event handlers
  const handleAddToWatchList = useCallback(
    async (result: MediaItem) => {
      const shouldMarkAsWatched = filter === "watched";
      const mediaType = (result.media_type || "movie") as "movie" | "tv";

      // Fetch detailed info to get genres, director, cast, etc.
      const detailedInfo = await fetchDetailedMediaInfo(
        result.external_id,
        mediaType
      );

      void addToWatchlist.mutateAsync({
        external_id: result.external_id,
        title: result.title,
        media_type: mediaType,
        poster_url: result.poster_url,
        release_date: result.release_date || null,
        overview: result.description || null,
        watched: shouldMarkAsWatched,
        genres: detailedInfo?.genres || null,
        director: detailedInfo?.director || null,
        cast_members: detailedInfo?.cast || null,
        vote_average: detailedInfo?.vote_average || null,
        vote_count: detailedInfo?.vote_count || null,
        runtime: detailedInfo?.runtime || null,
      });
      setShowSearchModal(false);
    },
    [addToWatchlist, filter]
  );

  const handleToggleWatched = useCallback(
    (id: string | number) => {
      void toggleWatched.mutateAsync(String(id));
    },
    [toggleWatched]
  );

  const handleRemoveFromWatchList = useCallback(
    (id: string | number) => {
      const item = watchList.find((item) => item.id === id);
      if (!item) return;

      setItemToDelete(item);
      setShowDeleteModal(true);
    },
    [watchList]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteFromWatchlist.mutateAsync(String(itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      logger.error("Failed to delete from watchlist", error);
      // Keep modal open so user sees the action failed
    }
  }, [itemToDelete, deleteFromWatchlist]);

  const handlePageChange = useCallback(
    (page: number, scrollRef?: React.RefObject<HTMLDivElement | null>) => {
      setCurrentPage(page);
      scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
    },
    [setCurrentPage]
  );

  return {
    // Data
    paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    watchList,
    availableGenres,

    // Counts
    toWatchCount,
    watchedCount,
    hasItemsForCurrentFilter,

    // Filter state
    filter,
    mediaTypeFilter,
    genreFilters,
    sortBy,

    // Filter setters
    setMediaTypeFilter,
    setGenreFilters,
    setSortBy,

    // Pagination
    setCurrentPage,
    setItemsPerPage,
    handlePageChange,

    // Modal state
    showSearchModal,
    setShowSearchModal,
    showSendModal,
    setShowSendModal,
    movieToRecommend,
    setMovieToRecommend,
    showDeleteModal,
    setShowDeleteModal,
    itemToDelete,
    setItemToDelete,

    // Handlers
    handleAddToWatchList,
    handleToggleWatched,
    handleRemoveFromWatchList,
    handleConfirmDelete,

    // Loading flags
    isDeleting: deleteFromWatchlist.isPending,
  };
}
