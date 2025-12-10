import { useState, useMemo, useCallback, useEffect } from "react";
import type { GameLibraryItem } from "../useGameLibraryQueries";
import type { MediaItem } from "@/components/shared";
import {
  useGameLibrary,
  useAddToGameLibrary,
  useToggleGameLibraryPlayed,
  useDeleteFromGameLibrary,
} from "../useGameLibraryQueries";
import { useMediaFiltering } from "../useMediaFiltering";
import { useUrlPaginationState } from "../useUrlPaginationState";
import { fetchGameDetails } from "../../utils/mediaSearchAdapters";
import {
  getPersistedFilters,
  persistFilters,
} from "../../utils/persistenceUtils";
import {
  GAME_LIBRARY_PERSISTENCE_KEY,
  GAME_LIBRARY_DEFAULT_FILTERS,
  type GameLibrarySortType,
} from "../../data/gameLibraryFilters";
import { logger } from "@/lib/logger";

type FilterType = "all" | "to-play" | "played";

export interface UseGameLibraryViewModelProps {
  initialFilter?: FilterType;
}

export function useGameLibraryViewModel({
  initialFilter = "all",
}: UseGameLibraryViewModelProps) {
  const { data: gameLibrary = [], isLoading } = useGameLibrary();
  const addToLibrary = useAddToGameLibrary();
  const togglePlayed = useToggleGameLibraryPlayed();
  const deleteFromLibrary = useDeleteFromGameLibrary();

  // Load persisted filter state
  const persistedFilters = getPersistedFilters(
    GAME_LIBRARY_PERSISTENCE_KEY,
    GAME_LIBRARY_DEFAULT_FILTERS
  );

  // Filter state
  const [filter] = useState<FilterType>(initialFilter);
  const [activeSort, setActiveSort] = useState<GameLibrarySortType>(
    persistedFilters.sortBy as GameLibrarySortType
  );
  const [genreFilters, setGenreFilters] = useState<string[]>(
    persistedFilters.genreFilters as string[]
  );

  // Modal and toast state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameLibraryItem | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<GameLibraryItem | null>(
    null
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Persist filter changes
  useEffect(() => {
    persistFilters(GAME_LIBRARY_PERSISTENCE_KEY, {
      genreFilters,
      sortBy: activeSort,
    });
  }, [genreFilters, activeSort]);

  // First, filter by played status to get the current view
  const filteredByStatus = useMemo(() => {
    if (filter === "to-play") return gameLibrary.filter((g) => !g.played);
    if (filter === "played") return gameLibrary.filter((g) => g.played);
    return gameLibrary;
  }, [gameLibrary, filter]);

  // Extract unique genres from the currently filtered games (by played status)
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    filteredByStatus.forEach((game) => {
      if (game.genres) {
        game.genres.split(",").forEach((genre) => {
          const trimmedGenre = genre.trim().toLowerCase();
          if (trimmedGenre) genreSet.add(trimmedGenre);
        });
      }
    });
    return genreSet;
  }, [filteredByStatus]);

  // Define filter function
  const filterFn = useCallback(
    (game: GameLibraryItem) => {
      // Filter by played status
      if (filter === "to-play" && game.played) return false;
      if (filter === "played" && !game.played) return false;

      // Filter by genres (multiple selection support)
      if (genreFilters.length === 0 || genreFilters.includes("all")) {
        return true;
      }

      if (game.genres) {
        const gameGenres = game.genres
          .toLowerCase()
          .split(",")
          .map((g) => g.trim());
        return genreFilters.some((selectedGenre) =>
          gameGenres.includes(selectedGenre)
        );
      }

      return false;
    },
    [filter, genreFilters]
  );

  // Define sort function
  const sortFn = useCallback(
    (a: GameLibraryItem, b: GameLibraryItem) => {
      switch (activeSort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "year": {
          const yearA = a.released ? parseInt(a.released.substring(0, 4)) : 0;
          const yearB = b.released ? parseInt(b.released.substring(0, 4)) : 0;
          return yearB - yearA;
        }
        case "rating": {
          const ratingA = a.personal_rating || 0;
          const ratingB = b.personal_rating || 0;
          return ratingB - ratingA;
        }
        case "date-added":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    },
    [activeSort]
  );

  // URL-based pagination state
  const { page, perPage, setPage, setPerPage } = useUrlPaginationState(1, 10);

  const {
    items: paginatedItems,
    totalPages,
    totalItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
  } = useMediaFiltering({
    items: gameLibrary,
    filterFn,
    sortFn,
    initialPage: page,
    initialItemsPerPage: perPage,
    persistenceKey: GAME_LIBRARY_PERSISTENCE_KEY,
    onPageChange: setPage,
    onItemsPerPageChange: setPerPage,
  });

  // Event handlers
  const handleAddGame = useCallback(
    async (game: MediaItem) => {
      try {
        const gameDetails = await fetchGameDetails(game.external_id);

        await addToLibrary.mutateAsync({
          external_id: game.external_id,
          slug: game.slug || "",
          name: game.title,
          released: game.release_date || null,
          background_image: game.poster_url,
          platforms: game.platforms || null,
          genres: game.genres || null,
          rating: game.rating || null,
          metacritic: game.metacritic || null,
          playtime: game.playtime || null,
          description_raw: gameDetails?.description_raw || null,
          played: false,
        });
        setToastMessage(`Added "${game.title}" to your library!`);
        setShowToast(true);
        setShowSearchModal(false);
      } catch (error) {
        logger.error("Failed to add game", { error });
        setToastMessage(
          "Failed to add game. It might already be in your library."
        );
        setShowToast(true);
      }
    },
    [addToLibrary]
  );

  const handleTogglePlayed = useCallback(
    async (game: GameLibraryItem) => {
      try {
        await togglePlayed.mutateAsync(game.id);
      } catch (error) {
        logger.error("Failed to toggle played status", {
          error,
          gameId: game.id,
        });
        setToastMessage("Failed to update game status");
        setShowToast(true);
      }
    },
    [togglePlayed]
  );

  const handleDelete = useCallback((game: GameLibraryItem) => {
    setGameToDelete(game);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!gameToDelete) return;

    try {
      await deleteFromLibrary.mutateAsync(gameToDelete.id);
      setShowDeleteModal(false);
      setGameToDelete(null);
    } catch (error) {
      logger.error("Failed to delete game", { error, gameId: gameToDelete.id });
      setToastMessage("Failed to remove game");
      setShowToast(true);
    }
  }, [gameToDelete, deleteFromLibrary]);

  const handleRecommendClick = useCallback((game: GameLibraryItem) => {
    setSelectedGame(game);
    setShowRecommendModal(true);
  }, []);

  const handleRecommendSent = useCallback(() => {
    setShowRecommendModal(false);
    setSelectedGame(null);
    setToastMessage("Game recommendation sent!");
    setShowToast(true);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  return {
    // Data
    gameLibrary,
    paginatedItems,
    totalPages,
    totalItems,
    currentPage,
    itemsPerPage,
    availableGenres,

    // Filter state
    filter,
    activeSort,
    genreFilters,

    // Filter setters
    setActiveSort,
    setGenreFilters,

    // Pagination
    setCurrentPage,
    setItemsPerPage,
    handlePageChange,

    // Modal state
    showSearchModal,
    setShowSearchModal,
    showRecommendModal,
    setShowRecommendModal,
    selectedGame,
    setSelectedGame,
    showDeleteModal,
    setShowDeleteModal,
    gameToDelete,

    // Toast state
    showToast,
    setShowToast,
    toastMessage,

    // Handlers
    handleAddGame,
    handleTogglePlayed,
    handleDelete,
    handleConfirmDelete,
    handleRecommendClick,
    handleRecommendSent,

    // Loading flags
    isLoading,
    isDeleting: deleteFromLibrary.isPending,
  };
}
