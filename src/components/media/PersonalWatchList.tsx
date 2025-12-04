import React, { useState, useRef, useMemo, useCallback } from "react";
import { Film } from "lucide-react";
import Chip from "../shared/ui/Chip";
import { getGenreColor } from "../../utils/genreColors";
import {
  SearchMovieModal,
  SendMediaModal,
  MediaPageToolbar,
  type SortOption,
  type MediaItem,
} from "@/components/shared";
import MediaListItem from "./MediaListItem";
import MediaEmptyState from "./MediaEmptyState";
import WatchlistPagination from "./WatchlistPagination";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import { useMediaFiltering } from "../../hooks/useMediaFiltering";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import { useWatchlistModals } from "../../hooks/useWatchlistModals";
import {
  useWatchlist,
  useAddToWatchlist,
  useToggleWatchlistWatched,
  useDeleteFromWatchlist,
} from "../../hooks/useWatchlistQueries";
import type { WatchlistItem } from "../../services/recommendationsService.types";
import { fetchDetailedMediaInfo } from "../../utils/tmdbDetails";

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
  const [genreFilters, setGenreFilters] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("date-added");

  // Pagination state
  const [showItemsPerPageMenu, setShowItemsPerPageMenu] = useState(false);

  // Modal state (managed by custom hook)
  const {
    showSearchModal,
    setShowSearchModal,
    showSendModal,
    setShowSendModal,
    movieToRecommend,
    setMovieToRecommend,
  } = useWatchlistModals<WatchlistItem>();

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WatchlistItem | null>(null);

  // Ref for scroll-to-top
  const topRef = useRef<HTMLDivElement>(null);

  // Extract unique genres from watchlist
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    watchList.forEach((item) => {
      if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach((genre) => {
          const trimmedGenre = genre.trim().toLowerCase();
          if (trimmedGenre) genreSet.add(trimmedGenre);
        });
      }
    });
    return genreSet;
  }, [watchList]);

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

      // Filter by genres (multiple selection support)
      if (genreFilters.length > 0 && !genreFilters.includes("all")) {
        if (!item.genres || item.genres.length === 0) return false;

        const itemGenres = item.genres.map((g) => g.trim().toLowerCase());
        const hasMatchingGenre = genreFilters.some((selectedGenre) =>
          itemGenres.includes(selectedGenre)
        );
        if (!hasMatchingGenre) return false;
      }

      return true;
    },
    [filter, mediaTypeFilter, genreFilters]
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
  const handleAddToWatchList = async (result: MediaItem) => {
    const shouldMarkAsWatched = filter === "watched";
    const mediaType = (result.media_type || "movie") as "movie" | "tv";

    // Fetch detailed info to get genres, director, cast, etc.
    const detailedInfo = await fetchDetailedMediaInfo(
      result.external_id,
      mediaType
    );

    void addToWatchlist.mutateAsync({
      external_id: result.external_id,
      title: result.title,
      media_type: mediaType,
      poster_url: result.poster_url,
      release_date: result.release_date || null,
      overview: result.description || null,
      watched: shouldMarkAsWatched,
      genres: detailedInfo?.genres || null,
      director: detailedInfo?.director || null,
      cast_members: detailedInfo?.cast || null,
      vote_average: detailedInfo?.vote_average || null,
      vote_count: detailedInfo?.vote_count || null,
      runtime: detailedInfo?.runtime || null,
    });
    setShowSearchModal(false);
  };

  const handleToggleWatched = (id: string | number) => {
    void toggleWatched.mutateAsync(String(id));
  };

  const handleRemoveFromWatchList = (id: string | number) => {
    const item = watchList.find((item) => item.id === id);
    if (!item) return;

    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteFromWatchlist.mutateAsync(String(itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete from watchlist:", error);
      // Keep modal open so user sees the action failed
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={topRef}
      className="container mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6"
    >
      {/* Controls Row: Filters + Sort + Actions */}
      {hasItemsForCurrentFilter && (
        <>
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
                  id: "genre",
                  title: "Genre",
                  multiSelect: true,
                  options: [
                    { id: "all", label: "All Genres" },
                    ...Array.from(availableGenres)
                      .sort()
                      .map((genre) => ({
                        id: genre,
                        label: genre.charAt(0).toUpperCase() + genre.slice(1),
                      })),
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
                genre: genreFilters,
                sort: sortBy,
              },
              onFilterChange: (sectionId, filterId) => {
                if (sectionId === "mediaType") {
                  setMediaTypeFilter(filterId as MediaTypeFilter);
                } else if (sectionId === "genre") {
                  const genres = Array.isArray(filterId)
                    ? filterId
                    : [filterId];
                  setGenreFilters(genres);
                } else if (sectionId === "sort") {
                  setSortBy(filterId as SortType);
                }
              },
            }}
            onAddClick={() => setShowSearchModal(true)}
          />

          {/* Active Filter Chips */}
          {(mediaTypeFilter !== "all" ||
            (!genreFilters.includes("all") && genreFilters.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {mediaTypeFilter !== "all" && (
                <Chip
                  variant="primary"
                  size="sm"
                  rounded="full"
                  removable
                  onRemove={() => setMediaTypeFilter("all")}
                >
                  {mediaTypeFilter === "movie" ? "Movies" : "TV Shows"}
                </Chip>
              )}

              {!genreFilters.includes("all") && genreFilters.length > 0 && (
                <>
                  {genreFilters.map((genre) => (
                    <span
                      key={genre}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getGenreColor(
                        genre
                      )}`}
                      onClick={() => {
                        const newFilters = genreFilters.filter(
                          (g) => g !== genre
                        );
                        setGenreFilters(
                          newFilters.length > 0 ? newFilters : ["all"]
                        );
                      }}
                    >
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      <button
                        type="button"
                        className="hover:opacity-70 transition-opacity"
                        aria-label="Remove filter"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Content: List or Empty State */}
      {!hasItemsForCurrentFilter ? (
        // Empty state when no items for current filter
        <MediaEmptyState
          icon={Film}
          title="Your Movie & TV list is empty"
          description="You haven't added any movies or TV shows to your list yet. Add content to start tracking what you're currently watching!"
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
        isLoading={deleteFromWatchlist.isPending}
      />
    </div>
  );
};

export default PersonalWatchList;
