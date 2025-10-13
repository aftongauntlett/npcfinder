import React, { useState, useEffect } from "react";
import MediaPageLayout from "../components/layouts/MediaPageLayout";
import MediaSearchBar from "../components/media/MediaSearchBar";
import MediaFilters from "../components/media/MediaFilters";
import MediaCard from "../components/media/MediaCard";
import MediaActionButtons from "../components/media/MediaActionButtons";
import MediaDetailModal from "../components/media/MediaDetailModal";
import { testSupabaseConnection } from "../lib/supabaseTest";

/**
 * Movies & TV Shows page with search, filtering, and personal ratings
 */
const MoviesTV = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Test Supabase connection on mount
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  // Filter configuration
  const filters = [
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
  ];

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      // Load user's saved items when search is empty
      loadUserItems();
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement TMDB API search
      // const response = await fetch(`https://api.themoviedb.org/3/search/multi?query=${query}&api_key=${API_KEY}`);
      // const data = await response.json();
      // setMediaItems(data.results);

      // Placeholder data for now
      console.log("Searching for:", query);
      setLoading(false);
    } catch (error) {
      console.error("Search error:", error);
      setLoading(false);
    }
  };

  // Load user's saved items from database
  const loadUserItems = async () => {
    setLoading(true);
    try {
      // TODO: Implement Supabase query
      // const { data, error } = await supabase
      //   .from('user_media')
      //   .select('*, media_items(*)')
      //   .eq('user_id', userId)
      //   .eq('media_type', activeFilters.type || 'all');

      // Placeholder data
      const placeholderItems = [
        {
          id: "1",
          title: "The Shawshank Redemption",
          type: "movie",
          poster: null,
          year: 1994,
          userRating: 5,
          userStatus: "completed",
          criticScore: 91,
          audienceScore: 98,
        },
        {
          id: "2",
          title: "Breaking Bad",
          type: "tv",
          poster: null,
          year: 2008,
          userRating: 5,
          userStatus: "completed",
          criticScore: 96,
          audienceScore: 97,
        },
        {
          id: "3",
          title: "Inception",
          type: "movie",
          poster: null,
          year: 2010,
          userRating: 4,
          userStatus: "completed",
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

  // Handle filter changes
  const handleFilterChange = (filterId, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  };

  // Handle random suggestion
  const handleRandom = () => {
    if (mediaItems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * mediaItems.length);
    const randomItem = mediaItems[randomIndex];
    setSelectedItem(randomItem);
    setIsModalOpen(true);
  };

  // Handle top lists
  const handleTopLists = () => {
    // TODO: Navigate to top lists page or show modal
    console.log("Show top 10 lists");
  };

  // Handle card click
  const handleCardClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Handle rating change
  const handleRatingChange = async (rating) => {
    if (!selectedItem) return;

    try {
      // TODO: Update rating in Supabase
      // await supabase
      //   .from('user_media')
      //   .update({ rating })
      //   .eq('user_id', userId)
      //   .eq('media_id', selectedItem.id);

      // Update local state
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, userRating: rating } : item
        )
      );
      setSelectedItem((prev) => ({ ...prev, userRating: rating }));
    } catch (error) {
      console.error("Rating update error:", error);
    }
  };

  // Handle status change
  const handleStatusChange = async (status) => {
    if (!selectedItem) return;

    try {
      // TODO: Update status in Supabase
      // await supabase
      //   .from('user_media')
      //   .update({ status })
      //   .eq('user_id', userId)
      //   .eq('media_id', selectedItem.id);

      // Update local state
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, userStatus: status } : item
        )
      );
      setSelectedItem((prev) => ({ ...prev, userStatus: status }));
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  // Load user items on mount
  useEffect(() => {
    loadUserItems();
  }, [activeFilters]);

  // Search bar component
  const searchBar = (
    <MediaSearchBar
      searchQuery={searchQuery}
      onSearchChange={handleSearch}
      placeholder="Search movies and TV shows..."
    />
  );

  // Filters component
  const filtersComponent = (
    <MediaFilters
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
    />
  );

  // Action buttons component
  const actionButtons = (
    <MediaActionButtons
      onRandomClick={handleRandom}
      onTopListsClick={handleTopLists}
      disabled={mediaItems.length === 0}
    />
  );

  // Main content grid
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
              : "No items yet. Search for movies and TV shows to get started!"}
          </p>
        </div>
      ) : (
        mediaItems.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={() => handleCardClick(item)}
          />
        ))
      )}
    </>
  );

  // Sidebar content (stats, friends activity, etc.)
  const sidebarContent = (
    <div className="space-y-6">
      {/* Stats Card */}
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
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {
                mediaItems.filter((item) => item.userStatus === "completed")
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
            <span className="text-gray-600 dark:text-gray-400">Avg Rating</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.length > 0
                ? (
                    mediaItems.reduce(
                      (sum, item) => sum + (item.userRating || 0),
                      0
                    ) / mediaItems.length
                  ).toFixed(1)
                : "0.0"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm text-gray-900 dark:text-white">
            View Top 10 Lists
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm text-gray-900 dark:text-white">
            Friends Activity
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm text-gray-900 dark:text-white">
            Recommendations
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MediaPageLayout
        title="Movies & TV Shows"
        searchBar={searchBar}
        filters={filtersComponent}
        actionButtons={actionButtons}
        mainContent={mainContent}
        sidebarContent={sidebarContent}
      />

      {/* Detail Modal */}
      <MediaDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem || {}}
        userRating={selectedItem?.userRating}
        userStatus={selectedItem?.userStatus}
        friendsRatings={[]} // TODO: Load friends' ratings from database
        onRatingChange={handleRatingChange}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};

export default MoviesTV;
