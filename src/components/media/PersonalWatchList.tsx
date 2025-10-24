import React, { useState, useRef } from "react";
import {
  Plus,
  X,
  Film,
  Tv,
  List,
  Check,
  Grid3x3,
  ChevronDown,
  Upload,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { MediaItem } from "../shared/SendMediaModal";
import SearchMovieModal from "../shared/SearchMovieModal";
import MovieDetailModal from "./MovieDetailModal";
import ImportMediaModal from "./ImportMediaModal";
import Button from "../shared/Button";
import SendMediaModal from "../shared/SendMediaModal";
import Toast from "../ui/Toast";
import MediaListItem from "./MediaListItem";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import {
  useWatchlist,
  useAddToWatchlist,
  useToggleWatchlistWatched,
  useDeleteFromWatchlist,
} from "../../hooks/useWatchlistQueries";
import { useViewMode } from "../../hooks/useViewMode";
import type { WatchlistItem } from "../../services/recommendationsService.types";
import { formatReleaseDate } from "../../utils/dateFormatting";

type FilterType = "all" | "to-watch" | "watched";
type SortType = "date-added" | "title" | "year" | "rating";
type MediaTypeFilter = "all" | "movie" | "tv";

interface PersonalWatchListProps {
  initialFilter?: FilterType;
  embedded?: boolean;
}

const PersonalWatchList: React.FC<PersonalWatchListProps> = ({
  initialFilter = "all",
  embedded: _embedded = false, // Reserved for future tabbed layout
}) => {
  // Fetch watchlist from database
  const { data: watchList = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const toggleWatched = useToggleWatchlistWatched();
  const deleteFromWatchlist = useDeleteFromWatchlist();

  // Filter is controlled by tabs (initialFilter prop), not by dropdown
  const [filter] = useState<FilterType>(initialFilter);
  const [mediaTypeFilter, setMediaTypeFilter] =
    useState<MediaTypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-added");
  const [viewMode, setViewMode] = useViewMode("grid");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<WatchlistItem | null>(
    null
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [movieToRecommend, setMovieToRecommend] =
    useState<WatchlistItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showItemsPerPageMenu, setShowItemsPerPageMenu] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const [lastDeletedItem, setLastDeletedItem] = useState<WatchlistItem | null>(
    null
  );
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Add to watch list
  const handleAddToWatchList = (result: MediaItem) => {
    // If we're on the "watched" tab, mark as watched immediately
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

  // Toggle watched status
  const handleToggleWatched = async (id: string) => {
    await toggleWatched.mutateAsync(id);
  };

  // Remove from watch list
  const handleRemoveFromWatchList = async (id: string) => {
    const itemToDelete = watchList.find((item) => item.id === id);
    if (!itemToDelete) return;

    // Store the deleted item for undo
    setLastDeletedItem(itemToDelete);
    setShowUndoToast(true);

    // Delete the item
    await deleteFromWatchlist.mutateAsync(id);
  };

  // Undo delete
  const handleUndoDelete = async () => {
    if (!lastDeletedItem) return;

    // Re-add the item
    await addToWatchlist.mutateAsync({
      external_id: lastDeletedItem.external_id,
      title: lastDeletedItem.title,
      media_type: lastDeletedItem.media_type,
      poster_url: lastDeletedItem.poster_url,
      release_date: lastDeletedItem.release_date,
      overview: lastDeletedItem.overview,
      watched: lastDeletedItem.watched,
    });

    // Clear the undo state
    setLastDeletedItem(null);
    setShowUndoToast(false);
  };

  // Filter and sort watch list
  const getFilteredAndSortedList = () => {
    // Filter by watched status
    let filtered = watchList.filter((item) => {
      if (filter === "to-watch") return !item.watched;
      if (filter === "watched") return item.watched;
      return true;
    });

    // Filter by media type
    if (mediaTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.media_type === mediaTypeFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
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
    });

    return filtered;
  };

  const filteredWatchList = getFilteredAndSortedList();
  const toWatchCount = watchList.filter((item) => !item.watched).length;
  const watchedCount = watchList.filter((item) => item.watched).length;

  // Pagination logic
  const totalItems = filteredWatchList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWatchList = filteredWatchList.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, mediaTypeFilter, sortBy, itemsPerPage]);

  // Determine if we should show controls based on current filter context
  const hasItemsForCurrentFilter =
    filter === "all"
      ? watchList.length > 0
      : filter === "to-watch"
      ? toWatchCount > 0
      : watchedCount > 0;

  return (
    <div ref={topRef} className="space-y-6">
      {/* Media Type Filter Chips */}
      {hasItemsForCurrentFilter && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMediaTypeFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mediaTypeFilter === "all"
                ? "bg-primary-contrast"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setMediaTypeFilter("tv")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mediaTypeFilter === "tv"
                ? "bg-purple-500/20 text-purple-700 dark:text-purple-200 ring-2 ring-purple-500/50"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Tv className="w-4 h-4" />
            TV Shows
          </button>
          <button
            onClick={() => setMediaTypeFilter("movie")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mediaTypeFilter === "movie"
                ? "bg-blue-500/20 text-blue-700 dark:text-blue-200 ring-2 ring-blue-500/50"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Film className="w-4 h-4" />
            Movies
          </button>
        </div>
      )}

      {/* Header with Sort, View Toggle, Add/Import Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side: Sort and View Toggle */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="font-medium">
                {sortBy === "date-added" && "Sort: Date Added"}
                {sortBy === "title" && "Sort: Title (A-Z)"}
                {sortBy === "year" && "Sort: Year"}
                {sortBy === "rating" && "Sort: Rating"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setSortBy("date-added");
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                      sortBy === "date-added"
                        ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {sortBy === "date-added" && (
                      <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                    )}
                    Sort: Date Added
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("title");
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                      sortBy === "title"
                        ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {sortBy === "title" && (
                      <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                    )}
                    Sort: Title (A-Z)
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("year");
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                      sortBy === "year"
                        ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {sortBy === "year" && (
                      <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                    )}
                    Sort: Year
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("rating");
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                      sortBy === "rating"
                        ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {sortBy === "rating" && (
                      <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                    )}
                    Sort: Rating
                  </button>
                </div>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
              title="Grid view"
              aria-label="Switch to grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid3x3 className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
              title="List view"
              aria-label="Switch to list view"
              aria-pressed={viewMode === "list"}
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right side: Add and Import Buttons */}
        <div className="flex items-center gap-3">
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

      {/* Watch List Items or Empty State */}
      {!hasItemsForCurrentFilter ? (
        // Show empty state when there are NO items for current filter
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
      ) : filteredWatchList.length === 0 ? (
        // Show simple message when user changes filter to something with no results
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {filter === "to-watch"
              ? "No unwatched items"
              : "No watched items yet"}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View - Netflix/Disney+ Style
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {paginatedWatchList.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedMovie(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedMovie(item);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${item.title}`}
              className="group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-lg overflow-hidden"
            >
              {/* Poster Image */}
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    {item.media_type === "tv" ? (
                      <Tv className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Film className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                )}

                {/* Watched Badge - Always Visible */}
                {item.watched && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Hover Overlay - Full info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                  {/* Title */}
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-200">
                    {item.release_date && (
                      <span>{formatReleaseDate(item.release_date)}</span>
                    )}
                    {item.media_type === "tv" && (
                      <>
                        <span>•</span>
                        <span className="font-medium">TV</span>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {item.watched ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRemoveFromWatchList(item.id);
                          }}
                          className="p-1.5 rounded btn-danger transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label="Remove from list"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovieToRecommend(item);
                            setShowSendModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded btn-recommend text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label="Recommend to friends"
                          title="Recommend"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Recommend</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRemoveFromWatchList(item.id);
                          }}
                          className="p-1.5 rounded btn-danger transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label="Remove from list"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleWatched(item.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded btn-success text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label="Mark as watched"
                          title="Mark Watched"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Watched</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-2">
          {paginatedWatchList.map((item) => (
            <MediaListItem
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={
                item.release_date
                  ? formatReleaseDate(item.release_date)
                  : undefined
              }
              posterUrl={item.poster_url || undefined}
              description={item.overview || undefined}
              onClick={() => setSelectedMovie(item)}
              isCompleted={item.watched}
              onToggleComplete={(id) => void handleToggleWatched(id as string)}
              onRecommend={
                item.watched
                  ? () => {
                      setMovieToRecommend(item);
                      setShowSendModal(true);
                    }
                  : undefined
              }
              onRemove={(id) => void handleRemoveFromWatchList(id as string)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {hasItemsForCurrentFilter && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Items per page with total count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Show:
            </span>
            <div className="relative">
              <button
                onClick={() => setShowItemsPerPageMenu(!showItemsPerPageMenu)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{itemsPerPage}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showItemsPerPageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowItemsPerPageMenu(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                    {[10, 25, 50, 100].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setShowItemsPerPageMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                          itemsPerPage === size
                            ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              per page ({totalItems} total)
            </span>
          </div>

          {/* Page info and navigation */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  topRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  topRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchMovieModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onAdd={handleAddToWatchList}
        existingIds={watchList.map((item) => item.external_id)}
      />
      {/* Send/Recommend Modal */}
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
      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          item={selectedMovie}
          _onToggleWatched={handleToggleWatched}
          _onRemove={handleRemoveFromWatchList}
        />
      )}
      {/* Import Media Modal */}
      <ImportMediaModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(_count) => {
          setShowImportModal(false);
          // TODO: Convert to UI toast notification
          // Successfully imported ${_count} movies
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
