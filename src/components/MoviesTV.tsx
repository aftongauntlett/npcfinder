import React, { useState, useEffect } from "react";
import MediaPageLayout from "./layouts/MediaPageLayout";
import MediaSearchBar from "./media/MediaSearchBar";
import MediaFilters, { type Filter } from "./media/MediaFilters";
import MediaCard from "./media/MediaCard";
import MediaActionButtons from "./media/MediaActionButtons";
import MediaDetailModal from "./media/MediaDetailModal";
import { testSupabaseConnection } from "../lib/supabaseTest";

type MediaStatus = "watched" | "to-watch";

type MediaDetailStatus = "completed" | "in-progress" | "to-watch" | "dropped";

interface MediaItem {
  id: string;
  title: string;
  type: string;
  poster?: string;
  year: number;
  userRating?: number;
  userStatus?: MediaStatus;
  criticScore?: number;
  audienceScore?: number;
}

const MOVIES_TV_FILTERS: Filter[] = [
  {
    id: "type",
    label: "Type",
    type: "buttons",
    options: [
      { value: "all", label: "All" },
      { value: "movie", label: "Movies" },
      { value: "tv", label: "TV Shows" },
    ],
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "completed", label: "Completed" },
      { value: "in-progress", label: "In Progress" },
      { value: "to-watch", label: "To Watch" },
      { value: "dropped", label: "Dropped" },
    ],
  },
  {
    id: "sort",
    label: "Sort By",
    type: "select",
    options: [
      { value: "title", label: "Title" },
      { value: "rating", label: "Your Rating" },
      { value: "year", label: "Release Year" },
      { value: "added", label: "Date Added" },
    ],
  },
] as const;

/**
 * Movies & TV Shows page with search, filtering, and personal ratings
 */
const MoviesTV: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Test Supabase connection on mount
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadUserItems();
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement TMDB API search
      console.log("Searching for:", query);
      setLoading(false);
    } catch (error) {
      console.error("Search error:", error);
      setLoading(false);
    }
  };

  // Load user's saved items
  const loadUserItems = async () => {
    setLoading(true);
    try {
      // TODO: Implement Supabase query for movies & TV
      const placeholderItems: MediaItem[] = [
        {
          id: "1",
          title: "The Shawshank Redemption",
          type: "movie",
          year: 1994,
          userRating: 5,
          userStatus: "watched",
          criticScore: 91,
          audienceScore: 98,
        },
        {
          id: "2",
          title: "Breaking Bad",
          type: "tv",
          year: 2008,
          userRating: 5,
          userStatus: "watched",
          criticScore: 96,
          audienceScore: 97,
        },
        {
          id: "3",
          title: "Inception",
          type: "movie",
          year: 2010,
          userRating: 4,
          userStatus: "watched",
          criticScore: 87,
          audienceScore: 91,
        },
      ];
      setMediaItems(placeholderItems);
      setLoading(false);
    } catch (error) {
      console.error("Load error:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
  };

  const handleRandom = () => {
    if (mediaItems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * mediaItems.length);
    setSelectedItem(mediaItems[randomIndex]);
    setIsModalOpen(true);
  };

  const handleTopLists = () => {
    console.log("Show top 10 movie/TV lists");
  };

  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleRatingChange = async (rating: number) => {
    if (!selectedItem) return;
    // TODO: Update rating in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, userRating: rating } : item
      )
    );
    setSelectedItem((prev) => (prev ? { ...prev, userRating: rating } : null));
  };

  const handleStatusChange = async (status: MediaDetailStatus) => {
    if (!selectedItem) return;
    // Map MediaDetailStatus to MediaStatus for Movies/TV
    const mediaStatus: MediaStatus =
      status === "completed" ? "watched" : "to-watch";
    // TODO: Update status in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, userStatus: mediaStatus }
          : item
      )
    );
    setSelectedItem((prev) =>
      prev ? { ...prev, userStatus: mediaStatus } : null
    );
  };

  useEffect(() => {
    loadUserItems();
  }, [activeFilters]);

  const searchBar = (
    <MediaSearchBar
      onSearch={handleSearch}
      placeholder="Search movies & TV shows..."
    />
  );

  const filtersComponent = (
    <MediaFilters
      filters={MOVIES_TV_FILTERS}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
    />
  );

  const actionButtons = (
    <MediaActionButtons
      onRandomClick={handleRandom}
      onTopListsClick={handleTopLists}
      disabled={mediaItems.length === 0}
    />
  );

  const mainContent = (
    <>
      {loading ? (
        <div className="col-span-full flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? "No results found. Try a different search."
              : "No movies or TV shows yet. Search to get started!"}
          </p>
        </div>
      ) : (
        mediaItems.map((item) => (
          <MediaCard
            key={item.id}
            id={item.id}
            title={item.title}
            subtitle={item.type === "movie" ? "Movie" : "TV Show"}
            posterUrl={item.poster}
            year={item.year}
            personalRating={item.userRating}
            criticRating={item.criticScore}
            audienceRating={item.audienceScore}
            status={item.userStatus}
            onClick={() => handleCardClick(item)}
          />
        ))
      )}
    </>
  );

  const sidebarContent = (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Stats
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total Items
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Watched</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {
                mediaItems.filter((item) => item.userStatus === "watched")
                  .length
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">To Watch</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {
                mediaItems.filter((item) => item.userStatus === "to-watch")
                  .length
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Movies</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.filter((item) => item.type === "movie").length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">TV Shows</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.filter((item) => item.type === "tv").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MediaPageLayout
        title="Movies & TV"
        searchBar={searchBar}
        filters={filtersComponent}
        actionButtons={actionButtons}
        content={mainContent}
        sidebar={sidebarContent}
      />
      {selectedItem && (
        <MediaDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={{
            title: selectedItem.title,
            poster: selectedItem.poster,
            year: selectedItem.year,
            criticScore: selectedItem.criticScore,
            audienceScore: selectedItem.audienceScore,
          }}
          userRating={selectedItem.userRating}
          userStatus={
            selectedItem.userStatus === "watched"
              ? ("completed" as const)
              : selectedItem.userStatus === "to-watch"
              ? ("to-watch" as const)
              : undefined
          }
          friendsRatings={[]}
          onRatingChange={handleRatingChange}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
};

export default MoviesTV;
