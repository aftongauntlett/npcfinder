import React, { useState, useEffect } from "react";
import MediaPageLayout from "./layouts/MediaPageLayout";
import MediaSearchBar from "./media/MediaSearchBar";
import MediaFilters, { type Filter } from "./media/MediaFilters";
import MediaCard from "./media/MediaCard";
import MediaListItem from "./media/MediaListItem";
import LayoutToggle from "./media/LayoutToggle";
import MediaActionButtons from "./media/MediaActionButtons";
import MediaDetailModal from "./media/MediaDetailModal";
import {
  searchMusic,
  getHighResArtwork,
  getYearFromReleaseDate,
} from "../lib/itunes";

type MediaStatus = "saved" | "to-listen";

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
  artist?: string;
  album?: string;
}

const MUSIC_FILTERS: Filter[] = [
  {
    id: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "all", label: "All" },
      { value: "track", label: "Tracks" },
      { value: "album", label: "Albums" },
      { value: "artist", label: "Artists" },
      { value: "playlist", label: "Playlists" },
    ],
  },
  {
    id: "genre",
    label: "Genre",
    type: "select",
    options: [
      { value: "pop", label: "Pop" },
      { value: "rock", label: "Rock" },
      { value: "hip-hop", label: "Hip Hop" },
      { value: "electronic", label: "Electronic" },
      { value: "jazz", label: "Jazz" },
      { value: "classical", label: "Classical" },
      { value: "country", label: "Country" },
      { value: "r&b", label: "R&B" },
    ],
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "saved", label: "Saved" },
      { value: "to-listen", label: "To Listen" },
    ],
  },
  {
    id: "sort",
    label: "Sort By",
    type: "select",
    options: [
      { value: "title", label: "Title" },
      { value: "artist", label: "Artist" },
      { value: "rating", label: "Your Rating" },
      { value: "year", label: "Release Year" },
      { value: "added", label: "Date Added" },
    ],
  },
] as const;

/**
 * Music page with iTunes Search API, search, filtering, and personal ratings
 * Users search for songs/albums, then save them with their own ratings to the database
 */
const Music: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [layout, setLayout] = useState<"grid" | "list">(() => {
    // Load layout preference from localStorage
    const saved = localStorage.getItem("music-layout");
    return saved === "list" || saved === "grid" ? saved : "list";
  });

  // Save layout preference
  const handleLayoutChange = (newLayout: "grid" | "list") => {
    setLayout(newLayout);
    localStorage.setItem("music-layout", newLayout);
  };

  // Load user's music on mount and when filters change
  useEffect(() => {
    void loadUserItems();
  }, [activeFilters]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      void loadUserItems();
      return;
    }

    setLoading(true);
    try {
      // Search iTunes API
      const results = await searchMusic(query, 20);

      // Combine songs and albums into media items
      const items: MediaItem[] = [];

      // Add albums
      results.albums.forEach((album) => {
        items.push({
          id: `album-${album.collectionId}`,
          title: album.collectionName,
          type: "album",
          artist: album.artistName,
          year: getYearFromReleaseDate(album.releaseDate),
          poster: getHighResArtwork(album.artworkUrl100, 300),
        });
      });

      // Add songs
      results.songs.forEach((song) => {
        items.push({
          id: `track-${song.trackId}`,
          title: song.trackName,
          type: "track",
          artist: song.artistName,
          album: song.collectionName,
          year: getYearFromReleaseDate(song.releaseDate),
          poster: getHighResArtwork(song.artworkUrl100, 300),
        });
      });

      setMediaItems(items);
      setLoading(false);
    } catch (error) {
      console.error("Error searching music:", error);
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  };

  // Load user's saved music
  const loadUserItems = () => {
    setLoading(true);
    try {
      // TODO: Load from Supabase and/or Spotify API
      // For now, show placeholder data
      const placeholderItems: MediaItem[] = [
        {
          id: "1",
          title: "Thriller",
          type: "album",
          artist: "Michael Jackson",
          year: 1982,
          poster:
            "https://coverartarchive.org/release/2225dd4c-ae9a-403b-8ea0-9e05014c778e/11497024856-500.jpg",
          userRating: 5,
          userStatus: "saved",
          criticScore: 96,
          audienceScore: 95,
        },
        {
          id: "2",
          title: "Abbey Road",
          type: "album",
          artist: "The Beatles",
          year: 1969,
          poster:
            "https://coverartarchive.org/release/773ad3da-50bd-4ad8-a713-851d34e222f6/24216424133-500.jpg",
          userRating: 5,
          userStatus: "saved",
          criticScore: 100,
          audienceScore: 98,
        },
        {
          id: "3",
          title: "Random Access Memories",
          type: "album",
          artist: "Daft Punk",
          year: 2013,
          poster:
            "https://coverartarchive.org/release/c9a0c8d3-c3a8-4968-925f-4e17f21e4137/25077743723-500.jpg",
          userRating: 4,
          userStatus: "saved",
          criticScore: 87,
          audienceScore: 89,
        },
      ];

      setMediaItems(placeholderItems);
      setLoading(false);
    } catch (error) {
      console.error("Error loading music:", error);
      setLoading(false);
    }
  };

  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleRandom = () => {
    if (mediaItems.length > 0) {
      const randomItem =
        mediaItems[Math.floor(Math.random() * mediaItems.length)];
      handleCardClick(randomItem);
    }
  };

  const handleTopLists = () => {
    console.log("Show top music lists");
    // TODO: Implement top lists modal
  };

  const handleRatingChange = (rating: number) => {
    if (!selectedItem) return;
    // TODO: Update rating in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, userRating: rating } : item
      )
    );
    setSelectedItem((prev) => (prev ? { ...prev, userRating: rating } : null));
  };

  const handleStatusChange = (status: MediaDetailStatus) => {
    if (!selectedItem) return;
    // Map MediaDetailStatus to MediaStatus for Music
    const musicStatus: MediaStatus =
      status === "completed" ? "saved" : "to-listen";
    // TODO: Update status in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, userStatus: musicStatus }
          : item
      )
    );
    setSelectedItem((prev) =>
      prev ? { ...prev, userStatus: musicStatus } : null
    );
  };

  useEffect(() => {
    void loadUserItems();
  }, [activeFilters]);

  const searchBar = (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <MediaSearchBar
          onSearch={(query) => void handleSearch(query)}
          placeholder="Search songs, albums, artists..."
        />
      </div>
      <LayoutToggle layout={layout} onLayoutChange={handleLayoutChange} />
    </div>
  );

  const filtersComponent = (
    <MediaFilters
      filters={MUSIC_FILTERS}
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
    <div
      className={
        layout === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          : "flex flex-col gap-3"
      }
    >
      {loading ? (
        <div className={layout === "grid" ? "col-span-full" : ""}>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      ) : mediaItems.length === 0 ? (
        <div className={layout === "grid" ? "col-span-full" : ""}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery
                ? "No results found. Try a different search."
                : "No music yet. Search to get started!"}
            </p>
          </div>
        </div>
      ) : (
        mediaItems.map((item) =>
          layout === "grid" ? (
            <MediaCard
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={item.artist || `${item.year}`}
              posterUrl={item.poster}
              year={item.year}
              personalRating={item.userRating}
              criticRating={item.criticScore}
              audienceRating={item.audienceScore}
              status={item.userStatus}
              onClick={() => handleCardClick(item)}
            />
          ) : (
            <MediaListItem
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={item.artist || `${item.year}`}
              posterUrl={item.poster}
              year={item.year}
              personalRating={item.userRating}
              criticRating={item.criticScore}
              audienceRating={item.audienceScore}
              status={item.userStatus}
              onClick={() => handleCardClick(item)}
            />
          )
        )
      )}
    </div>
  );

  const sidebarContent = (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Stats
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Total</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Saved</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.filter((item) => item.userStatus === "saved").length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">To Listen</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {
                mediaItems.filter((item) => item.userStatus === "to-listen")
                  .length
              }
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleRandom}
            disabled={mediaItems.length === 0}
            className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎲 Random Pick
          </button>
          <button
            onClick={handleTopLists}
            className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            🏆 Top Charts
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MediaPageLayout
        title="Music"
        searchBar={searchBar}
        filters={filtersComponent}
        actionButtons={actionButtons}
        content={mainContent}
        sidebar={sidebarContent}
      />

      {selectedItem && (
        <MediaDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          item={{
            title: selectedItem.title,
            year: selectedItem.year,
            poster: selectedItem.poster,
            criticScore: selectedItem.criticScore,
            audienceScore: selectedItem.audienceScore,
            description: selectedItem.artist
              ? `Artist: ${selectedItem.artist}${
                  selectedItem.album ? ` • Album: ${selectedItem.album}` : ""
                }`
              : undefined,
          }}
          userRating={selectedItem.userRating}
          userStatus={
            selectedItem.userStatus === "saved" ? "completed" : "to-watch"
          }
          onRatingChange={handleRatingChange}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
};

export default Music;
