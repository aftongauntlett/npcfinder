import React, { useRef } from "react";
import {
  SearchMovieModal,
  SendMediaModal,
  Pagination,
} from "@/components/shared";
import MediaListItem from "./MediaListItem";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import { useWatchlistViewModel } from "../../hooks/media/useWatchlistViewModel";
import WatchlistToolbar from "./WatchlistToolbar";
import WatchlistEmptyState from "./WatchlistEmptyState";

type FilterType = "all" | "to-watch" | "watched";

interface PersonalWatchListProps {
  initialFilter?: FilterType;
}

const PersonalWatchList: React.FC<PersonalWatchListProps> = ({
  initialFilter = "all",
}) => {
  // Ref for scroll-to-top
  const topRef = useRef<HTMLDivElement>(null);

  // Use the view model hook
  const {
    paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    watchList,
    availableGenres,
    toWatchCount: _toWatchCount,
    watchedCount: _watchedCount,
    hasItemsForCurrentFilter,
    filter,
    mediaTypeFilter,
    genreFilters,
    sortBy,
    setMediaTypeFilter,
    setGenreFilters,
    setSortBy,
    setItemsPerPage,
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
    handleAddToWatchList,
    handleToggleWatched,
    handleRemoveFromWatchList,
    handleConfirmDelete,
    handlePageChange,
    isDeleting,
  } = useWatchlistViewModel({ initialFilter });

  return (
    <div
      ref={topRef}
      className="container mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6"
    >
      {/* Controls Row: Filters + Sort + Actions */}
      {hasItemsForCurrentFilter && (
        <WatchlistToolbar
          availableGenres={availableGenres}
          mediaTypeFilter={mediaTypeFilter}
          genreFilters={genreFilters}
          sortBy={sortBy}
          onMediaTypeChange={setMediaTypeFilter}
          onGenresChange={setGenreFilters}
          onSortChange={setSortBy}
          onAddClick={() => setShowSearchModal(true)}
        />
      )}

      {/* Content: List or Empty State */}
      <WatchlistEmptyState
        filter={filter}
        mediaTypeFilter={mediaTypeFilter}
        genreFilters={genreFilters}
        hasItemsForCurrentFilter={hasItemsForCurrentFilter}
        totalItems={totalItems}
        onAddClick={() => setShowSearchModal(true)}
      />

      {/* List View */}
      {hasItemsForCurrentFilter && totalItems > 0 && (
        <>
          <div className="space-y-4">
            {paginatedItems.map((item) => (
              <MediaListItem
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.director || undefined}
                posterUrl={item.poster_url || undefined}
                year={item.release_date?.split("-")[0]}
                description={item.overview || undefined}
                mediaType={item.media_type}
                genres={item.genres?.join(", ") || undefined}
                externalId={item.external_id}
                releaseDate={item.release_date || undefined}
                isCompleted={item.watched}
                onToggleComplete={handleToggleWatched}
                onRemove={handleRemoveFromWatchList}
                onRecommend={() => {
                  setMovieToRecommend(item);
                  setShowSendModal(true);
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => handlePageChange(page, topRef)}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* Modals */}
      <SearchMovieModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onAdd={handleAddToWatchList}
        existingIds={watchList.map((item) => item.external_id)}
      />

      <SendMediaModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setMovieToRecommend(null);
        }}
        onSent={() => {
          setShowSendModal(false);
          setMovieToRecommend(null);
        }}
        mediaType="movies"
        tableName="movie_recommendations"
        searchPlaceholder="Search for movies or TV shows..."
        searchFunction={searchMoviesAndTV}
        recommendationTypes={[
          { value: "watch", label: "Watch" },
          { value: "rewatch", label: "Rewatch" },
        ]}
        defaultRecommendationType="watch"
        preselectedItem={
          movieToRecommend
            ? {
                external_id: movieToRecommend.external_id,
                title: movieToRecommend.title,
                media_type: movieToRecommend.media_type,
                poster_url: movieToRecommend.poster_url,
                release_date: movieToRecommend.release_date,
                description: movieToRecommend.overview,
              }
            : undefined
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove from Watchlist?"
        message={
          itemToDelete
            ? `Are you sure you want to remove "${itemToDelete.title}" from your watchlist?`
            : ""
        }
        confirmText="Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PersonalWatchList;
