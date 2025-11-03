import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Plus,
  Film,
  Tv,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MediaItem } from "../shared/SendMediaModal";
import SearchMovieModal from "../shared/SearchMovieModal";
import MovieDetailModal from "./MovieDetailModal";
import ImportMediaModal from "./ImportMediaModal";
import Button from "../shared/Button";
import SendMediaModal from "../shared/SendMediaModal";
import Toast from "../ui/Toast";
import MediaListItem from "./MediaListItem";
import MediaTypeFilters, { FilterOption } from "./MediaTypeFilters";
import SortDropdown, { SortOption } from "./SortDropdown";
import { useMediaFiltering } from "../../hooks/useMediaFiltering";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import {
  useWatchlist,
  useAddToWatchlist,
  useToggleWatchlistWatched,
  useDeleteFromWatchlist,
} from "../../hooks/useWatchlistQueries";
import type { WatchlistItem } from "../../services/recommendationsService.types";

type FilterType = "all" | "to-watch" | "watched";
type SortType = "date-added" | "title" | "year" | "rating";
type MediaTypeFilter = "all" | "movie" | "tv";

interface PersonalWatchListProps {
  initialFilter?: FilterType;
  embedded?: boolean;
}

// Filter options for media type
const MEDIA_TYPE_FILTERS: FilterOption[] = [
  { id: "all", label: "All Media" },
  {
    id: "tv",
    label: "TV Shows",
    icon: Tv,
    colorClass:
      "bg-purple-500/20 text-purple-700 dark:text-purple-200 ring-2 ring-purple-500/50",
  },
  {
    id: "movie",
    label: "Movies",
    icon: Film,
    colorClass:
      "bg-blue-500/20 text-blue-700 dark:text-blue-200 ring-2 ring-blue-500/50",
  },
];

// Sort options
const SORT_OPTIONS: SortOption[] = [
  { id: "date-added", label: "Sort: Date Added" },
  { id: "title", label: "Sort: Title (A-Z)" },
  { id: "year", label: "Sort: Year" },
  { id: "rating", label: "Sort: Rating" },
];

const PersonalWatchList: React.FC<PersonalWatchListProps> = ({
  initialFilter = "all",
  embedded: _embedded = false,
}) => {
  // Data fetching
  const { data: watchList = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const toggleWatched = useToggleWatchlistWatched();
  const deleteFromWatchlist = useDeleteFromWatchlist();

  // Filter state (controlled by tabs via prop)
  const [filter] = useState<FilterType>(initialFilter);
  const [mediaTypeFilter, setMediaTypeFilter] =
    useState<MediaTypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-added");

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<WatchlistItem | null>(
    null
  );
  const [movieToRecommend, setMovieToRecommend] =
    useState<WatchlistItem | null>(null);

  // Undo state
  const [lastDeletedItem, setLastDeletedItem] = useState<WatchlistItem | null>(
    null
  );
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Ref for scroll-to-top
  const topRef = useRef<HTMLDivElement>(null);

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

      return true;
    },
    [filter, mediaTypeFilter]
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

  // Use the filtering hook
  const {
    items: paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    setCurrentPage,
    hasNextPage,
    hasPrevPage,
    itemsPerPage,
    setItemsPerPage,
  } = useMediaFiltering({
    items: watchList,
    filterFn,
    sortFn,
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
  const handleAddToWatchList = (result: MediaItem) => {
    const shouldMarkAsWatched = filter === "watched";

    void addToWatchlist.mutateAsync({
      external_id: result.external_id,
      title: result.title,
      media_type: (result.media_type || "movie") as "movie" | "tv",
      poster_url: result.poster_url,
      release_date: result.release_date || null,
      overview: result.description || null,
      watched: shouldMarkAsWatched,
    });
    setShowSearchModal(false);
  };

  const handleToggleWatched = (id: string | number) => {
    void toggleWatched.mutateAsync(String(id));
  };

  const handleToggleWatchedAsync = async (id: string) => {
    await toggleWatched.mutateAsync(id);
  };

  const handleRemoveFromWatchList = (id: string | number) => {
    const itemToDelete = watchList.find((item) => item.id === id);
    if (!itemToDelete) return;

    setLastDeletedItem(itemToDelete);
    setShowUndoToast(true);
    void deleteFromWatchlist.mutateAsync(String(id));
  };

  const handleRemoveFromWatchListAsync = async (id: string) => {
    const itemToDelete = watchList.find((item) => item.id === id);
    if (!itemToDelete) return;

    setLastDeletedItem(itemToDelete);
    setShowUndoToast(true);
    await deleteFromWatchlist.mutateAsync(id);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedItem) return;

    await addToWatchlist.mutateAsync({
      external_id: lastDeletedItem.external_id,
      title: lastDeletedItem.title,
      media_type: lastDeletedItem.media_type,
      poster_url: lastDeletedItem.poster_url,
      release_date: lastDeletedItem.release_date,
      overview: lastDeletedItem.overview,
      watched: lastDeletedItem.watched,
    });

    setLastDeletedItem(null);
    setShowUndoToast(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={topRef} className="space-y-6">
      {/* Controls Row: Filters + Sort + Actions */}
      {hasItemsForCurrentFilter && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Media Type Filter Chips */}
          <MediaTypeFilters
            filters={MEDIA_TYPE_FILTERS}
            activeFilter={mediaTypeFilter}
            onFilterChange={(filterId) =>
              setMediaTypeFilter(filterId as MediaTypeFilter)
            }
          />

          {/* Right: Sort + Action Buttons */}
          <div className="flex items-center gap-3">
            <SortDropdown
              options={SORT_OPTIONS}
              activeSort={sortBy}
              onSortChange={(sortId) => setSortBy(sortId as SortType)}
            />

            <Button
              onClick={() => setShowSearchModal(true)}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add
            </Button>

            <Button
              onClick={() => setShowImportModal(true)}
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
            >
              Import
            </Button>
          </div>
        </div>
      )}

      {/* Content: List or Empty State */}
      {!hasItemsForCurrentFilter ? (
        // Empty state when no items for current filter
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Film className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Your watchlist is empty
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
            Start building your watchlist by searching for movies below.
          </p>
        </div>
      ) : totalItems === 0 ? (
        // Message when filter has no results
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {mediaTypeFilter === "tv" && "No TV shows found"}
            {mediaTypeFilter === "movie" && "No movies found"}
            {mediaTypeFilter === "all" && "No items found"}
          </p>
        </div>
      ) : (
        <>
          {/* List View */}
          <div className="space-y-4">
            {paginatedItems.map((item) => (
              <MediaListItem
                key={item.id}
                id={item.id}
                title={item.title}
                posterUrl={item.poster_url || undefined}
                year={item.release_date?.split("-")[0]}
                description={item.overview || undefined}
                mediaType={item.media_type}
                isCompleted={item.watched}
                onToggleComplete={handleToggleWatched}
                onRemove={handleRemoveFromWatchList}
                onClick={() => setSelectedMovie(item)}
                onRecommend={() => {
                  setMovieToRecommend(item);
                  setShowSendModal(true);
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Items per page */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => {
                      const menu = document.getElementById(
                        "items-per-page-menu"
                      );
                      if (menu) {
                        menu.style.display =
                          menu.style.display === "block" ? "none" : "block";
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {itemsPerPage}
                  </button>
                  <div
                    id="items-per-page-menu"
                    style={{ display: "none" }}
                    className="absolute bottom-full left-0 mb-2 w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          document.getElementById(
                            "items-per-page-menu"
                          )!.style.display = "none";
                        }}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          itemsPerPage === size
                            ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  per page ({totalItems} total)
                </span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {selectedMovie && (
        <MovieDetailModal
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          item={selectedMovie}
          _onToggleWatched={handleToggleWatchedAsync}
          _onRemove={handleRemoveFromWatchListAsync}
        />
      )}

      <ImportMediaModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(_count) => {
          setShowImportModal(false);
        }}
      />

      {/* Undo Toast */}
      {showUndoToast && lastDeletedItem && (
        <Toast
          message={`Removed "${lastDeletedItem.title}"`}
          action={{
            label: "Undo",
            onClick: () => void handleUndoDelete(),
          }}
          onClose={() => {
            setShowUndoToast(false);
            setLastDeletedItem(null);
          }}
        />
      )}
    </div>
  );
};

export default PersonalWatchList;
