import React, { useState, useCallback, useMemo } from "react";
import { Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../shared/ui/Button";
import Chip from "../../shared/ui/Chip";
import MediaEmptyState from "../../media/MediaEmptyState";
import MediaListItem from "../../media/MediaListItem";
import { FilterSortSection } from "../../shared/common/FilterSortMenu";
import { MediaPageToolbar } from "../../shared/media/MediaPageToolbar";
import SendMediaModal from "../../shared/media/SendMediaModal";
import SearchGameModal from "../../shared/search/SearchGameModal";
import GameDetailModal from "./GameDetailModal";
import Toast from "../../ui/Toast";
import { useMediaFiltering } from "../../../hooks/useMediaFiltering";
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
  const [filter] = useState<FilterType>(initialFilter);
  const [activeSort, setActiveSort] = useState<SortType>("date-added");
  const [genreFilters, setGenreFilters] = useState<string[]>(["all"]);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameLibraryItem | null>(
    null
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Undo state
  const [lastDeletedGame, setLastDeletedGame] =
    useState<GameLibraryItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

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

  // Use the filtering hook
  const {
    items: paginatedItems,
    totalPages,
    currentPage,
    setCurrentPage,
  } = useMediaFiltering({
    items: gameLibrary,
    filterFn,
    sortFn,
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
      console.error("Failed to add game:", error);
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
      console.error("Failed to toggle played status:", error);
      setToastMessage("Failed to update game status");
      setShowToast(true);
    }
  };

  // Handle delete
  const handleDelete = async (game: GameLibraryItem) => {
    setLastDeletedGame(game);
    setShowUndoToast(true);
    try {
      await deleteFromLibrary.mutateAsync(game.id);
    } catch (error) {
      console.error("Failed to delete game:", error);
      setShowUndoToast(false);
      setLastDeletedGame(null);
      setToastMessage("Failed to remove game");
      setShowToast(true);
    }
  };

  // Handle undo delete
  const handleUndoDelete = async () => {
    if (!lastDeletedGame) return;

    try {
      // Fetch full game details to restore with description
      const gameDetails = await fetchGameDetails(lastDeletedGame.external_id);

      await addToLibrary.mutateAsync({
        external_id: lastDeletedGame.external_id,
        slug: lastDeletedGame.slug,
        name: lastDeletedGame.name,
        released: lastDeletedGame.released,
        background_image: lastDeletedGame.background_image,
        platforms: lastDeletedGame.platforms,
        genres: lastDeletedGame.genres,
        rating: lastDeletedGame.rating,
        metacritic: lastDeletedGame.metacritic,
        playtime: lastDeletedGame.playtime,
        description_raw:
          gameDetails?.description_raw || lastDeletedGame.description_raw,
        played: lastDeletedGame.played,
      });

      setLastDeletedGame(null);
      setShowUndoToast(false);
    } catch (error) {
      console.error("Failed to restore game:", error);
      setToastMessage("Failed to restore game");
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
      <>
        <div className="mt-6">
          <MediaEmptyState
            icon={Gamepad2}
            title="Your Game list is empty"
            description="You haven't added any games to your list yet. Add games to start tracking what you're currently playing!"
            onClick={() => setShowSearchModal(true)}
            ariaLabel="Add games to your library"
          />
        </div>

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
      </>
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
            }}
            onAddClick={() => setShowSearchModal(true)}
          />

          {/* Active Filter Chips */}
          {!genreFilters.includes("all") && genreFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genreFilters.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    const newFilters = genreFilters.filter((g) => g !== genre);
                    setGenreFilters(
                      newFilters.length > 0 ? newFilters : ["all"]
                    );
                  }}
                >
                  <Chip
                    variant="primary"
                    size="sm"
                    rounded="full"
                    removable
                    onRemove={() => {}}
                  >
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </Chip>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Game List */}
      {gameLibrary.length === 0 ? (
        <MediaEmptyState
          icon={Gamepad2}
          title="Your Game list is empty"
          description="You haven't added any games to your list yet. Add games to start tracking what you're currently playing!"
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Add your first game"
        />
      ) : paginatedItems.length === 0 ? (
        <MediaEmptyState
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
          {/* Note: subtitle field shows platforms for games (e.g., "PC, PlayStation, Xbox")
              Unlike other media types that show creator info (director, author, artist),
              game developer/studio data is not currently available from RAWG API */}
          {paginatedItems.map((game) => (
            <MediaListItem
              key={game.id}
              id={game.id}
              title={game.name}
              subtitle={game.platforms || undefined}
              posterUrl={game.background_image || undefined}
              year={game.released?.split("-")[0]}
              personalRating={game.personal_rating || undefined}
              criticRating={game.rating ? game.rating * 20 : undefined} // Convert 0-5 to 0-100 scale
              genres={game.genres || undefined}
              isCompleted={game.played}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="subtle"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            variant="subtle"
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

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

      {/* Toast */}
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

      {/* Undo Toast */}
      {showUndoToast && lastDeletedGame && (
        <Toast
          message={`Removed "${lastDeletedGame.name}"`}
          action={{
            label: "Undo",
            onClick: () => void handleUndoDelete(),
          }}
          onClose={() => {
            setShowUndoToast(false);
            setLastDeletedGame(null);
          }}
        />
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
    </div>
  );
};

export default PersonalGameLibrary;
