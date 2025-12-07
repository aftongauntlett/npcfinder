import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Gamepad2 } from "lucide-react";
import { Pagination } from "../../shared/common/Pagination";
import { EmptyStateAddCard } from "../../shared";
import MediaListItem from "../../media/MediaListItem";
import { FilterSortSection } from "../../shared/common/FilterSortMenu";
import { MediaPageToolbar } from "../../shared/media/MediaPageToolbar";
import SendMediaModal from "../../shared/media/SendMediaModal";
import SearchGameModal from "../../shared/search/SearchGameModal";
import GameDetailModal from "./GameDetailModal";
import Toast from "../../ui/Toast";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import { useMediaFiltering } from "../../../hooks/useMediaFiltering";
import { useUrlPaginationState } from "../../../hooks/useUrlPaginationState";
import { logger } from "@/lib/logger";
import {
  searchGames,
  fetchGameDetails,
} from "../../../utils/mediaSearchAdapters";
import {
  useGameLibrary,
  useAddToGameLibrary,
  useToggleGameLibraryPlayed,
  useDeleteFromGameLibrary,
} from "../../../hooks/useGameLibraryQueries";
import type { GameLibraryItem } from "../../../hooks/useGameLibraryQueries";
import type { MediaItem } from "../../shared/media/SendMediaModal";
import {
  getPersistedFilters,
  persistFilters,
} from "../../../utils/persistenceUtils";

type FilterType = "all" | "to-play" | "played";
type SortType = "date-added" | "name" | "year" | "rating";

interface PersonalGameLibraryProps {
  initialFilter?: FilterType;
  embedded?: boolean;
}

/**
 * Personal Game Library Component
 *
 * Displays user's game library with filtering and sorting.
 * Reuses MediaListItem and other media components for consistency.
 *
 * Features:
 * - Add games via search
 * - Toggle played status
 * - Sort by various criteria
 * - Recommend games to friends
 * - Delete from library
 */
const PersonalGameLibrary: React.FC<PersonalGameLibraryProps> = ({
  initialFilter = "all",
}) => {
  // Load persisted filter state
  const persistenceKey = "gameLibrary";
  const persistedFilters = getPersistedFilters(persistenceKey, {
    genreFilters: ["all"],
    sortBy: "date-added",
  });

  const [filter] = useState<FilterType>(initialFilter);
  const [activeSort, setActiveSort] = useState<SortType>(
    persistedFilters.sortBy as SortType
  );
  const [genreFilters, setGenreFilters] = useState<string[]>(
    persistedFilters.genreFilters as string[]
  );

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameLibraryItem | null>(
    null
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<GameLibraryItem | null>(
    null
  );

  // Persist filter changes
  useEffect(() => {
    persistFilters(persistenceKey, {
      genreFilters,
      sortBy: activeSort,
    });
  }, [genreFilters, activeSort]);

  // Fetch library
  const { data: gameLibrary = [], isLoading } = useGameLibrary();
  const addToLibrary = useAddToGameLibrary();
  const togglePlayed = useToggleGameLibraryPlayed();
  const deleteFromLibrary = useDeleteFromGameLibrary();

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
        // Split comma-separated genres and trim whitespace
        game.genres.split(",").forEach((genre) => {
          const trimmedGenre = genre.trim().toLowerCase();
          if (trimmedGenre) genreSet.add(trimmedGenre);
        });
      }
    });
    return genreSet;
  }, [filteredByStatus]);

  // Create filter & sort sections for FilterSortMenu
  const filterSortSections = useMemo((): FilterSortSection[] => {
    // Sort genres alphabetically
    const sortedGenres = Array.from(availableGenres).sort();

    const genreOptions = [
      { id: "all", label: "All Genres" },
      ...sortedGenres.map((genre) => ({
        id: genre,
        label: genre.charAt(0).toUpperCase() + genre.slice(1),
      })),
    ];

    return [
      {
        id: "genre",
        title: "Genre",
        multiSelect: true,
        options: genreOptions,
      },
      {
        id: "sort",
        title: "Sort By",
        options: [
          { id: "date-added", label: "Recently Added" },
          { id: "name", label: "Name (A-Z)" },
          { id: "year", label: "Release Year" },
          { id: "rating", label: "Your Rating" },
        ],
      },
    ];
  }, [availableGenres]);

  // Define filter function (now includes genre filter)
  const filterFn = useCallback(
    (game: GameLibraryItem) => {
      // Filter by played status
      if (filter === "to-play" && game.played) return false;
      if (filter === "played" && !game.played) return false;

      // Filter by genres (multiple selection support)
      if (genreFilters.length === 0 || genreFilters.includes("all")) {
        return true;
      }

      // Game matches if it matches ANY of the selected genres
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

  // Use the filtering hook
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
    persistenceKey,
    onPageChange: setPage,
    onItemsPerPageChange: setPerPage,
  });

  // Handle add game from search
  const handleAddGame = async (game: MediaItem) => {
    try {
      // Fetch full game details to get description
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
  };

  // Handle toggle played
  const handleTogglePlayed = async (game: GameLibraryItem) => {
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
  };

  // Handle delete
  const handleDelete = (game: GameLibraryItem) => {
    setGameToDelete(game);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
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
  };

  // Handle recommend
  const handleRecommendClick = (game: GameLibraryItem) => {
    setSelectedGame(game);
    setShowRecommendModal(true);
  };

  const handleRecommendSent = () => {
    setShowRecommendModal(false);
    setSelectedGame(null);
    setToastMessage("Game recommendation sent!");
    setShowToast(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading games...</div>
      </div>
    );
  }

  // Empty state
  if (gameLibrary.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6">
        <EmptyStateAddCard
          icon={Gamepad2}
          title="Your Game list is empty"
          description="You haven't added any games to your list yet. Add games to start tracking what you're currently playing!"
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Add games to your library"
        />

        {/* Search Modal */}
        {showSearchModal && (
          <SearchGameModal
            onClose={() => setShowSearchModal(false)}
            onSelect={(game) => void handleAddGame(game)}
            existingIds={gameLibrary.map((g) => g.external_id)}
          />
        )}

        {/* Toast */}
        {showToast && (
          <Toast message={toastMessage} onClose={() => setShowToast(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Controls - Only show when there are items to display */}
      {paginatedItems.length > 0 && (
        <div className="space-y-3 mb-6">
          <MediaPageToolbar
            filterConfig={{
              type: "menu",
              sections: filterSortSections,
              activeFilters: {
                genre: genreFilters,
                sort: activeSort,
              },
              onFilterChange: (sectionId, value) => {
                if (sectionId === "genre") {
                  const genres = Array.isArray(value) ? value : [value];
                  setGenreFilters(genres);
                } else if (sectionId === "sort") {
                  setActiveSort(value as SortType);
                }
              },
              onResetFilters: () => {
                setGenreFilters(["all"]);
              },
              hasActiveFilters:
                !genreFilters.includes("all") && genreFilters.length > 0,
            }}
            onAddClick={() => setShowSearchModal(true)}
          />
        </div>
      )}

      {/* Game List */}
      {gameLibrary.length === 0 ? (
        <EmptyStateAddCard
          icon={Gamepad2}
          title="Your Game list is empty"
          description="You haven't added any games to your list yet. Add games to start tracking what you're currently playing!"
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Add your first game"
        />
      ) : paginatedItems.length === 0 ? (
        <EmptyStateAddCard
          icon={Gamepad2}
          title={
            filter === "to-play"
              ? "Your Game list is empty"
              : filter === "played"
              ? "Your Game list is empty"
              : "No Games Found"
          }
          description={
            filter === "to-play"
              ? "You haven't added any games to your list yet. Add games to start tracking what you're currently playing!"
              : filter === "played"
              ? "You haven't added any games to your list yet. Add games to start tracking what you're currently playing!"
              : genreFilters.length > 0 && !genreFilters.includes("all")
              ? `No games found in selected genres: ${genreFilters.join(", ")}`
              : "No games found matching your current filters."
          }
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Add games to your library"
        />
      ) : (
        <div className="space-y-2 max-w-full overflow-hidden">
          {paginatedItems.map((game) => (
            <MediaListItem
              key={game.id}
              id={game.id}
              title={game.name}
              subtitle={undefined}
              posterUrl={game.background_image || undefined}
              year={game.released?.split("-")[0]}
              personalRating={game.personal_rating || undefined}
              genres={game.genres || undefined}
              isCompleted={game.played}
              mediaType="game"
              externalId={game.external_id}
              platforms={game.platforms || undefined}
              metacritic={game.metacritic || undefined}
              playtime={game.playtime || undefined}
              onToggleComplete={() => void handleTogglePlayed(game)}
              onRecommend={() => handleRecommendClick(game)}
              onRemove={() => void handleDelete(game)}
              onClick={() => {
                setSelectedGame(game);
                setShowDetailModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Search Modal */}
      {showSearchModal && (
        <SearchGameModal
          onClose={() => setShowSearchModal(false)}
          onSelect={(game) => void handleAddGame(game)}
          existingIds={gameLibrary.map((g) => g.external_id)}
        />
      )}

      {/* Recommend Modal */}
      {selectedGame && (
        <SendMediaModal
          isOpen={showRecommendModal}
          onClose={() => {
            setShowRecommendModal(false);
            setSelectedGame(null);
          }}
          onSent={handleRecommendSent}
          mediaType="games"
          tableName="game_recommendations"
          searchPlaceholder="Search for games..."
          searchFunction={searchGames}
          preselectedItem={{
            external_id: selectedGame.external_id,
            title: selectedGame.name,
            subtitle: selectedGame.platforms || undefined,
            poster_url: selectedGame.background_image,
            release_date: selectedGame.released,
            description: selectedGame.genres || undefined,
            media_type: "game",
            slug: selectedGame.slug,
            platforms: selectedGame.platforms || undefined,
            genres: selectedGame.genres || undefined,
            rating: selectedGame.rating || undefined,
            metacritic: selectedGame.metacritic || undefined,
            playtime: selectedGame.playtime || undefined,
          }}
          recommendationTypes={[
            { value: "play", label: "Play" },
            { value: "replay", label: "Replay" },
          ]}
        />
      )}

      {/* Success notification Toast (NOT for delete operations) */}
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

      {/* Game Detail Modal */}
      {selectedGame && showDetailModal && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedGame(null);
          }}
          onTogglePlayed={() => {
            void handleTogglePlayed(selectedGame);
            setShowDetailModal(false);
            setSelectedGame(null);
          }}
          onRemove={() => {
            void handleDelete(selectedGame);
            setShowDetailModal(false);
            setSelectedGame(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setGameToDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove from Library?"
        message={
          gameToDelete
            ? `Are you sure you want to remove "${gameToDelete.name}" from your library?`
            : ""
        }
        confirmText="Remove"
        variant="danger"
        isLoading={deleteFromLibrary.isPending}
      />
    </div>
  );
};

export default PersonalGameLibrary;
