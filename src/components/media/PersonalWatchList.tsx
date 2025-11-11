import React, { useState, useRef, useMemo, useCallback } from "react";
import { Film } from "lucide-react";
import { MediaItem } from "../shared/SendMediaModal";
import SearchMovieModal from "../shared/SearchMovieModal";
import MovieDetailModal from "./MovieDetailModal";
import SendMediaModal from "../shared/SendMediaModal";
import Toast from "../ui/Toast";
import MediaListItem from "./MediaListItem";
import MediaEmptyState from "./MediaEmptyState";
import WatchlistPagination from "./WatchlistPagination";
import { SortOption } from "../shared/types";
import { MediaPageToolbar } from "../shared/MediaPageToolbar";
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

  // Pagination state
  const [showItemsPerPageMenu, setShowItemsPerPageMenu] = useState(false);

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
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

  const handleRemoveFromWatchList = (id: string | number) => {
    const itemToDelete = watchList.find((item) => item.id === id);
    if (!itemToDelete) return;

    setLastDeletedItem(itemToDelete);
    setShowUndoToast(true);
    void deleteFromWatchlist.mutateAsync(String(id));
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
        <MediaPageToolbar
          filterConfig={{
            type: "menu",
            sections: [
              {
                id: "mediaType",
                title: "Media Type",
                options: [
                  { id: "all", label: "All Media" },
                  { id: "movie", label: "Movies" },
                  { id: "tv", label: "TV Shows" },
                ],
              },
              {
                id: "sort",
                title: "Sort By",
                options: SORT_OPTIONS.map((opt) => ({
                  id: opt.id,
                  label: opt.label.replace("Sort: ", ""),
                })),
              },
            ],
            activeFilters: {
              mediaType: mediaTypeFilter,
              sort: sortBy,
            },
            onFilterChange: (sectionId, filterId) => {
              if (sectionId === "mediaType") {
                setMediaTypeFilter(filterId as MediaTypeFilter);
              } else if (sectionId === "sort") {
                setSortBy(filterId as SortType);
              }
            },
          }}
          onAddClick={() => setShowSearchModal(true)}
        />
      )}

      {/* Content: List or Empty State */}
      {!hasItemsForCurrentFilter ? (
        // Empty state when no items for current filter
        <MediaEmptyState
          icon={Film}
          title="Your watchlist is empty"
          description="Start building your watchlist by searching for movies and TV shows below."
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Add movies or TV shows to your watchlist"
        />
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
                genres={item.genres?.join(", ") || undefined}
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
          <WatchlistPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            showItemsPerPageMenu={showItemsPerPageMenu}
            onPageChange={handlePageChange}
            onItemsPerPageChange={setItemsPerPage}
            onToggleMenu={() => setShowItemsPerPageMenu(!showItemsPerPageMenu)}
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

      {selectedMovie && (
        <MovieDetailModal
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          item={selectedMovie}
        />
      )}

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
