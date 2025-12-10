import React from "react";
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
    setActiveSort,
    setGenreFilters,
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
    setShowToast,
    toastMessage,
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
          <Toast message={toastMessage} onClose={() => setShowToast(false)} />
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
          onGenresChange={setGenreFilters}
          onSortChange={setActiveSort}
          onAddClick={() => setShowSearchModal(true)}
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
