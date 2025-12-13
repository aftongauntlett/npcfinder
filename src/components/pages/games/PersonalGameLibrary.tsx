import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { Pagination } from "../../shared/common/Pagination";
import { EmptyStateAddCard } from "../../shared";
import MediaListItem from "../../media/MediaListItem";
import SendMediaModal from "../../shared/media/SendMediaModal";
import SearchGameModal from "../../shared/search/SearchGameModal";
import Toast from "../../ui/Toast";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import { searchGames } from "../../../utils/mediaSearchAdapters";
import { useGameLibraryViewModel } from "../../../hooks/games/useGameLibraryViewModel";
import GameLibraryToolbar from "./GameLibraryToolbar";

type FilterType = "all" | "to-play" | "played";

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
  // Collapse state
  const [collapseKey, setCollapseKey] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | number | null>(null);

  useEffect(() => {
    if (recentlyMovedId === null) return;
    const timer = setTimeout(() => setRecentlyMovedId(null), 650);
    return () => clearTimeout(timer);
  }, [recentlyMovedId]);

  const handleCollapseAll = () => {
    setCollapseKey((prev) => prev + 1);
    setExpandedItems(new Set());
  };

  const handleExpandChange = (id: string, isExpanded: boolean) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Use the view model hook
  const {
    gameLibrary,
    paginatedItems,
    totalPages,
    totalItems,
    currentPage,
    itemsPerPage,
    availableGenres,
    filter,
    activeSort,
    genreFilters,
    searchQuery,
    setActiveSort,
    setGenreFilters,
    setSearchQuery,
    setCurrentPage,
    setItemsPerPage,
    showSearchModal,
    setShowSearchModal,
    showRecommendModal,
    setShowRecommendModal,
    selectedGame,
    setSelectedGame,
    showDeleteModal,
    setShowDeleteModal,
    gameToDelete: _gameToDelete,
    showToast,
    dismissToast,
    toastMessage,
    toastAction,
    handleAddGame,
    handleTogglePlayed,
    handleDelete,
    handleConfirmDelete,
    handleRecommendClick,
    handleRecommendSent,
    isLoading,
    isDeleting,
  } = useGameLibraryViewModel({ initialFilter });

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
          <Toast message={toastMessage} action={toastAction} onClose={dismissToast} />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Controls - Only show when there are items to display */}
      {paginatedItems.length > 0 && (
        <GameLibraryToolbar
          availableGenres={availableGenres}
          genreFilters={genreFilters}
          activeSort={activeSort}
          searchQuery={searchQuery}
          onGenresChange={setGenreFilters}
          onSortChange={setActiveSort}
          onSearchChange={setSearchQuery}
          onAddClick={() => setShowSearchModal(true)}
          onCollapseAll={handleCollapseAll}
          hasExpandedItems={expandedItems.size > 0}
        />
      )}

      {/* Game List */}
      {paginatedItems.length === 0 ? (
        <EmptyStateAddCard
          icon={Gamepad2}
          title={
            filter === "to-play" || filter === "played"
              ? "Your Game list is empty"
              : "No Games Found"
          }
          description={
            filter === "to-play" || filter === "played"
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
          <AnimatePresence initial={false}>
            {paginatedItems.map((game) => (
              <motion.div
                key={`${game.id}-${collapseKey}`}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: recentlyMovedId === game.id ? 1.01 : 1,
                }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <MediaListItem
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
                  onToggleComplete={() => {
                    setRecentlyMovedId(game.id);
                    void handleTogglePlayed(game);
                  }}
                  onRecommend={() => handleRecommendClick(game)}
                  onRemove={() => void handleDelete(game)}
                  onExpandChange={(isExpanded) =>
                    handleExpandChange(game.id, isExpanded)
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
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
        <Toast message={toastMessage} action={toastAction} onClose={dismissToast} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGame(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove from Library?"
        message={
          selectedGame
            ? `Are you sure you want to remove "${selectedGame.name}" from your library?`
            : ""
        }
        confirmText="Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PersonalGameLibrary;
