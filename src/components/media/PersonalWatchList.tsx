import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Film,
  Tv,
  Eye,
  EyeOff,
  List,
  Check,
  Grid3x3,
  ChevronDown,
} from "lucide-react";
import { MediaItem } from "../shared/SendMediaModal";
import SearchMovieModal from "../shared/SearchMovieModal";
import MovieDetailModal from "./MovieDetailModal";
import Button from "../shared/Button";

interface WatchListItem {
  id: string;
  external_id: string;
  title: string;
  media_type: "movie" | "tv";
  poster_url: string | null;
  release_date: string | null;
  description: string | null;
  watched: boolean;
  added_at: string;
}

type FilterType = "all" | "to-watch" | "watched";
type SortType = "date-added" | "title" | "year" | "rating";
type ViewMode = "grid" | "list";

const PersonalWatchList: React.FC = () => {
  const [watchList, setWatchList] = useState<WatchListItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-added");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<WatchListItem | null>(
    null
  );
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Mock data for now
  useEffect(() => {
    const mockWatchList: WatchListItem[] = [
      {
        id: "wl-1",
        external_id: "550",
        title: "Fight Club",
        media_type: "movie",
        poster_url:
          "https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        release_date: "1999",
        description:
          "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
        watched: false,
        added_at: new Date().toISOString(),
      },
      {
        id: "wl-2",
        external_id: "238",
        title: "The Godfather",
        media_type: "movie",
        poster_url:
          "https://image.tmdb.org/t/p/w200/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
        release_date: "1972",
        description:
          "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
        watched: true,
        added_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    setWatchList(mockWatchList);
  }, []);

  // Add to watch list
  const handleAddToWatchList = (result: MediaItem) => {
    const newItem: WatchListItem = {
      id: `wl-${Date.now()}`,
      external_id: result.external_id,
      title: result.title,
      media_type: (result.media_type || "movie") as "movie" | "tv",
      poster_url: result.poster_url,
      release_date: result.release_date || null,
      description: result.description || null,
      watched: false,
      added_at: new Date().toISOString(),
    };

    setWatchList([newItem, ...watchList]);
    setShowSearchModal(false);
  };

  // Toggle watched status
  const toggleWatched = (id: string) => {
    setWatchList(
      watchList.map((item) =>
        item.id === id ? { ...item, watched: !item.watched } : item
      )
    );
  };

  // Remove from watch list
  const removeFromWatchList = (id: string) => {
    setWatchList(watchList.filter((item) => item.id !== id));
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

  return (
    <div className="space-y-6">
      {/* Header with Filter, Sort, View Toggle, and Add Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium">
                {filter === "all" && "All"}
                {filter === "to-watch" && "To Watch"}
                {filter === "watched" && "Watched"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showFilterMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilterMenu(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-2 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Filter by Status
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFilter("all");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-colors ${
                      filter === "all"
                        ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${
                          filter === "all"
                            ? "bg-gray-200 dark:bg-gray-600"
                            : "bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        <Film className="w-4 h-4" />
                      </div>
                      <span>All Movies & Shows</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === "all"
                          ? "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {watchList.length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter("to-watch");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-colors ${
                      filter === "to-watch"
                        ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${
                          filter === "to-watch"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </div>
                      <span>To Watch</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === "to-watch"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {toWatchCount}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter("watched");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-colors ${
                      filter === "watched"
                        ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${
                          filter === "watched"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </div>
                      <span>Watched</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === "watched"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {watchedCount}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-offset-0 focus:border-transparent outline-none"
            style={
              {
                "--tw-ring-color": "var(--color-primary)",
              } as React.CSSProperties
            }
          >
            <option value="date-added">Sort: Date Added</option>
            <option value="title">Sort: Title (A-Z)</option>
            <option value="year">Sort: Year</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button - Primary CTA */}
          <Button
            onClick={() => setShowSearchModal(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Movie/Show
          </Button>
        </div>
      </div>

      {/* Removed Tabs - now integrated into filter dropdown */}
      <div className="border-b border-gray-200 dark:border-gray-700" />

      {/* Watch List Items */}
      {filteredWatchList.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            {filter === "to-watch" && <Eye className="w-16 h-16 mx-auto" />}
            {filter === "watched" && <Check className="w-16 h-16 mx-auto" />}
            {filter === "all" && <Film className="w-16 h-16 mx-auto" />}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "to-watch" && "No unwatched items"}
            {filter === "watched" && "No watched items yet"}
            {filter === "all" && "Your watch list is empty"}
          </p>
          {filter === "all" && (
            <Button
              onClick={() => setShowSearchModal(true)}
              variant="outline"
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
            >
              Add your first movie or show
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredWatchList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer group"
              onClick={() => setSelectedMovie(item)}
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
                    {item.description || "Click to view details"}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatched(item.id);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                      item.watched
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                        : "bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title={
                      item.watched ? "Mark as unwatched" : "Mark as watched"
                    }
                  >
                    {item.watched ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Watched</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Watch</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchList(item.id);
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    aria-label="Remove from watch list"
                    title="Remove from list"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
              onClick={() => setSelectedMovie(item)}
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
                {item.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatched(item.id);
                  }}
                  className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={item.watched ? "Mark as unwatched" : "Mark as watched"}
                >
                  {item.watched ? (
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchList(item.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  aria-label="Remove from watch list"
                >
                  <X className="w-5 h-5" />
                </button>
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

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          item={selectedMovie}
          onToggleWatched={toggleWatched}
          onRemove={removeFromWatchList}
        />
      )}
    </div>
  );
};

export default PersonalWatchList;
