import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SearchMovieModal,
  SendMediaModal,
  Pagination,
} from "@/components/shared";
import MediaListItem from "./MediaListItem";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import Toast from "@/components/ui/Toast";
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

  // Collapse all state
  const [collapseKey, setCollapseKey] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | number | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);

  useEffect(() => {
    if (recentlyMovedId === null) return;
    const timer = setTimeout(() => setRecentlyMovedId(null), 650);
    return () => clearTimeout(timer);
  }, [recentlyMovedId]);

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
    searchQuery,
    setMediaTypeFilter,
    setGenreFilters,
    setSortBy,
    setSearchQuery,
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

  // Collapse all handler
  const handleCollapseAll = () => {
    setCollapseKey(prev => prev + 1);
    setExpandedItems(new Set());
  };

  // Track expansion changes
  const handleExpandChange = (id: string | number, isExpanded: boolean) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      const stringId = String(id);
      if (isExpanded) {
        newSet.add(stringId);
      } else {
        newSet.delete(stringId);
      }
      return newSet;
    });
  };

  return (
    <div
      ref={topRef}
      className="container mx-auto px-4 sm:px-6"
    >
      {/* Controls Row: Filters + Sort + Actions */}
      {hasItemsForCurrentFilter && (
        <WatchlistToolbar
          availableGenres={availableGenres}
          mediaTypeFilter={mediaTypeFilter}
          genreFilters={genreFilters}
          sortBy={sortBy}
          searchQuery={searchQuery}
          onMediaTypeChange={setMediaTypeFilter}
          onGenresChange={setGenreFilters}
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
          onAddClick={() => setShowSearchModal(true)}
          onCollapseAll={handleCollapseAll}
          hasExpandedItems={expandedItems.size > 0}
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
            <AnimatePresence initial={false}>
              {paginatedItems.map((item) => (
                <motion.div
                  key={`${item.id}-${collapseKey}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: recentlyMovedId === item.id ? 1.01 : 1,
                  }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <MediaListItem
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
                    onToggleComplete={(id) => {
                      setRecentlyMovedId(id);
                      handleToggleWatched(id);
                      setToast({
                        message: `${item.title} moved`,
                        action: {
                          label: "Undo",
                          onClick: () => {
                            setRecentlyMovedId(id);
                            handleToggleWatched(id);
                            setToast(null);
                          },
                        },
                      });
                    }}
                    onRemove={handleRemoveFromWatchList}
                    onRecommend={() => {
                      setMovieToRecommend(item);
                      setShowSendModal(true);
                    }}
                    onExpandChange={(isExpanded) =>
                      handleExpandChange(item.id, isExpanded)
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
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

      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default PersonalWatchList;
