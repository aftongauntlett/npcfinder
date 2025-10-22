import React, { useState } from "react";
import {
  Plus,
  X,
  Film,
  Tv,
  Play,
  List,
  Check,
  Grid3x3,
  ChevronDown,
  Send,
  Upload,
} from "lucide-react";
import { MediaItem } from "../shared/SendMediaModal";
import SearchMovieModal from "../shared/SearchMovieModal";
import MovieDetailModal from "./MovieDetailModal";
import ImportMediaModal from "./ImportMediaModal";
import Button from "../shared/Button";
import MediaEmptyState from "./MediaEmptyState";
import SendMediaModal from "../shared/SendMediaModal";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import {
  useWatchlist,
  useAddToWatchlist,
  useToggleWatchlistWatched,
  useDeleteFromWatchlist,
} from "../../hooks/useWatchlistQueries";
import { useViewMode } from "../../hooks/useViewMode";
import type { WatchlistItem } from "../../services/recommendationsService";

type FilterType = "all" | "to-watch" | "watched";
type SortType = "date-added" | "title" | "year" | "rating";

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

  // Add to watch list
  const handleAddToWatchList = (result: MediaItem) => {
    void addToWatchlist.mutateAsync({
      external_id: result.external_id,
      title: result.title,
      media_type: (result.media_type || "movie") as "movie" | "tv",
      poster_url: result.poster_url,
      release_date: result.release_date || null,
      overview: result.description || null,
    });
    setShowSearchModal(false);
  };

  // Toggle watched status
  const handleToggleWatched = (id: string) => {
    void toggleWatched.mutateAsync(id);
  };

  // Remove from watch list
  const handleRemoveFromWatchList = (id: string) => {
    void deleteFromWatchlist.mutateAsync(id);
  };

  // Filter and sort watch list
  const getFilteredAndSortedList = () => {
    // Filter
    let filtered = watchList.filter((item) => {
      if (filter === "to-watch") return !item.watched;
      if (filter === "watched") return item.watched;
      return true;
    });

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

  // Determine if we should show controls based on current filter context
  const hasItemsForCurrentFilter =
    filter === "all"
      ? watchList.length > 0
      : filter === "to-watch"
      ? toWatchCount > 0
      : watchedCount > 0;

  return (
    <div className="space-y-6">
      {/* Header with Sort, View Toggle, Add/Import Buttons - Only show if there are items for current filter */}
      {hasItemsForCurrentFilter && (
        <>
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
              {/* Add Button - Enhanced Primary CTA - Only show when watchlist has items */}
              {watchList.length > 0 && (
                <>
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
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Watch List Items or Empty State */}
      {!hasItemsForCurrentFilter ? (
        // Show nice card when there are NO items for current filter
        <MediaEmptyState
          icon={Plus}
          title="Add your first movie or show"
          description="Search for a movie or import a list from Notion, Excel, or any text source"
          actions={[
            {
              label: "Add",
              onClick: () => setShowSearchModal(true),
              variant: "primary",
              icon: Plus,
            },
            {
              label: "Import",
              onClick: () => setShowImportModal(true),
              variant: "secondary",
              icon: Upload,
            },
          ]}
        />
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
        // Grid View
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredWatchList.map((item) => (
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
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 cursor-pointer group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            >
              {/* Poster */}
              <div className="relative overflow-hidden">
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    {item.media_type === "tv" ? (
                      <Tv className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Film className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                )}

                {/* Watched overlay with better styling */}
                {item.watched && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center">
                    <div className="bg-green-500 rounded-full p-3 shadow-lg">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}

                {/* Hover overlay with gradient */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex items-end">
                  <p className="text-white text-xs line-clamp-2">
                    {item.overview || "Click to view details"}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  {item.release_date && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {item.release_date}
                    </span>
                  )}
                  {item.media_type === "tv" && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                      TV
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  {/* Recommend button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMovieToRecommend(item);
                      setShowSendModal(true);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                    aria-label="Recommend to friends"
                    title="Recommend"
                  >
                    <Send className="w-5 h-5" />
                  </button>

                  {/* Watch/Remove button based on status */}
                  {item.watched ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemoveFromWatchList(item.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                      aria-label="Remove from list"
                      title="Remove"
                    >
                      <X className="w-5 h-5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleWatched(item.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                      aria-label="Mark as watched"
                      title="Watched"
                    >
                      <Play className="w-5 h-5" />
                      <span className="hidden sm:inline">Watched</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-2">
          {filteredWatchList.map((item) => (
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
              className="w-full bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            >
              {/* Small Poster */}
              <div className="flex-shrink-0">
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    {item.media_type === "tv" ? (
                      <Tv className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Film className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                {item.release_date && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.release_date}
                  </p>
                )}
                {item.overview && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.overview}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Recommend button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMovieToRecommend(item);
                    setShowSendModal(true);
                  }}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                  aria-label="Recommend to friends"
                  title="Recommend"
                >
                  <Send className="w-5 h-5" />
                </button>

                {/* Watch/Remove button based on status */}
                {item.watched ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRemoveFromWatchList(item.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                    aria-label="Remove from list"
                    title="Remove"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleWatched(item.id);
                    }}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                    aria-label="Mark as watched"
                    title="Watched"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
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
          onToggleWatched={handleToggleWatched}
          onRemove={handleRemoveFromWatchList}
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
    </div>
  );
};

export default PersonalWatchList;
