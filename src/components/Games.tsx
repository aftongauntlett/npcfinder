import React, { useState, useEffect } from "react";
import MediaPageLayout from "./layouts/MediaPageLayout";
import MediaSearchBar from "./media/MediaSearchBar";
import MediaFilters, { type Filter } from "./media/MediaFilters";
import MediaCard from "./media/MediaCard";
import MediaActionButtons from "./media/MediaActionButtons";
import MediaDetailModal from "./media/MediaDetailModal";

type MediaStatus = "played" | "to-play";

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

const GAME_FILTERS: Filter[] = [
  {
    id: "platform",
    label: "Platform",
    type: "select",
    options: [
      { value: "pc", label: "PC" },
      { value: "playstation", label: "PlayStation" },
      { value: "xbox", label: "Xbox" },
      { value: "nintendo", label: "Nintendo Switch" },
      { value: "mobile", label: "Mobile" },
    ],
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "completed", label: "Completed" },
      { value: "playing", label: "Playing" },
      { value: "to-play", label: "To Play" },
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
 * Games page with search, filtering, and personal ratings
 */
const Games: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadUserItems();
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement RAWG API search
      console.log("Searching for games:", query);
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
      // TODO: Implement Supabase query for games
      const placeholderItems: MediaItem[] = [
        {
          id: "1",
          title: "The Legend of Zelda: Breath of the Wild",
          type: "game",
          year: 2017,
          userRating: 5,
          userStatus: "played",
          criticScore: 97,
          audienceScore: 93,
        },
        {
          id: "2",
          title: "Elden Ring",
          type: "game",
          year: 2022,
          userRating: 5,
          userStatus: "played",
          criticScore: 96,
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
    console.log("Show top 10 game lists");
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
    // Map MediaDetailStatus to MediaStatus for Games
    const gameStatus: MediaStatus =
      status === "completed" ? "played" : "to-play";
    // TODO: Update status in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, userStatus: gameStatus } : item
      )
    );
    setSelectedItem((prev) =>
      prev ? { ...prev, userStatus: gameStatus } : null
    );
  };

  useEffect(() => {
    loadUserItems();
  }, [activeFilters]);

  const searchBar = (
    <MediaSearchBar onSearch={handleSearch} placeholder="Search games..." />
  );

  const filtersComponent = (
    <MediaFilters
      filters={GAME_FILTERS}
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
              : "No games yet. Search to get started!"}
          </p>
        </div>
      ) : (
        mediaItems.map((item) => (
          <MediaCard
            key={item.id}
            id={item.id}
            title={item.title}
            subtitle={`${item.year}`}
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
              Total Games
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Played</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.filter((item) => item.userStatus === "played").length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">To Play</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {
                mediaItems.filter((item) => item.userStatus === "to-play")
                  .length
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MediaPageLayout
        title="Games"
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
            selectedItem.userStatus === "played"
              ? ("completed" as const)
              : selectedItem.userStatus === "to-play"
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

export default Games;
