import React, { useState, useEffect, useCallback } from "react";
import MediaPageLayout from "./layouts/MediaPageLayout";
import MediaSearchBar from "./media/MediaSearchBar";
import MediaFilters, { type Filter } from "./media/MediaFilters";
import MediaCard from "./media/MediaCard";
import MediaListItem from "./media/MediaListItem";
import LayoutToggle from "./media/LayoutToggle";
import MediaActionButtons from "./media/MediaActionButtons";
import MediaDetailModal from "./media/MediaDetailModal";
import { BrowseMediaModal } from "./media/BrowseMediaModal";
import {
  searchMusic,
  getHighResArtwork,
  getYearFromReleaseDate,
} from "../lib/itunes";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Plus } from "lucide-react";

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
    ],
  },
  {
    id: "genre",
    label: "Genre",
    type: "select",
    options: [
      { value: "all", label: "All Genres" },
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
      { value: "all", label: "All" },
      { value: "saved", label: "Saved" },
      { value: "to-listen", label: "To Listen" },
    ],
  },
  {
    id: "sort",
    label: "Sort By",
    type: "select",
    options: [
      { value: "added", label: "Date Added" },
      { value: "title", label: "Title" },
      { value: "artist", label: "Artist" },
      { value: "rating", label: "Your Rating" },
      { value: "year", label: "Release Year" },
    ],
  },
] as const;

/**
 * Music page with iTunes Search API, database integration, and personal ratings
 * Users browse iTunes to add music, then manage their collection with ratings and statuses
 */
const Music: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    type: "all",
    status: "all",
    genre: "all",
    sort: "added",
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState<boolean>(false);
  const [layout, setLayout] = useState<"grid" | "list">(() => {
    // Load layout preference from localStorage
    const saved = localStorage.getItem("music-layout");
    return saved === "list" || saved === "grid" ? saved : "grid";
  });

  // Save layout preference
  const handleLayoutChange = (newLayout: "grid" | "list") => {
    setLayout(newLayout);
    localStorage.setItem("music-layout", newLayout);
  };

  // Load user's saved music from Supabase
  const loadUserItems = useCallback(async () => {
    if (!user) {
      setMediaItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("user_music")
        .select("*")
        .eq("user_id", user.id);

      // Apply filters
      if (activeFilters.type && activeFilters.type !== "all") {
        query = query.eq("media_type", activeFilters.type);
      }
      if (activeFilters.status && activeFilters.status !== "all") {
        query = query.eq("user_status", activeFilters.status);
      }
      if (activeFilters.genre && activeFilters.genre !== "all") {
        query = query.eq("genre", activeFilters.genre);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,album.ilike.%${searchQuery}%`
        );
      }

      // Apply sorting
      switch (activeFilters.sort) {
        case "title":
          query = query.order("title", { ascending: true });
          break;
        case "artist":
          query = query.order("artist", { ascending: true });
          break;
        case "rating":
          query = query.order("user_rating", { ascending: false, nullsFirst: false });
          break;
        case "year":
          query = query.order("year", { ascending: false });
          break;
        case "added":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      const items: MediaItem[] =
        data?.map((item) => ({
          id: item.external_id,
          title: item.title,
          type: item.media_type,
          artist: item.artist || undefined,
          album: item.album || undefined,
          year: item.year,
          poster: item.poster_url || undefined,
          userRating: item.user_rating || undefined,
          userStatus: item.user_status,
        })) || [];

      setMediaItems(items);
    } catch (error) {
      console.error("Error loading music:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activeFilters, searchQuery]);

  // Load user's music on mount and when filters/search change
  useEffect(() => {
    void loadUserItems();
  }, [loadUserItems]);

  // Handle search - filters user's saved music
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Search function for BrowseModal - searches iTunes API
  const searchBrowseMusic = async (query: string): Promise<MediaItem[]> => {
    const results = await searchMusic(query, 20);
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

    return items;
  };

  // Add music to user's collection
  const handleAddMusic = async (item: MediaItem) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("user_music").insert({
        user_id: user.id,
        external_id: item.id,
        title: item.title,
        media_type: item.type || "track", // Default to track if type is missing
        artist: item.artist,
        album: item.album,
        year: item.year,
        poster_url: item.poster,
        user_status: "saved",
      });

      if (error) {
        // Check if it's a duplicate error
        if (error.code === "23505") {
          console.log("Item already in collection");
          return;
        }
        throw error;
      }

      // Reload user's collection
      await loadUserItems();
    } catch (error) {
      console.error("Error adding music:", error);
      throw error;
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
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

  const handleRatingChange = async (rating: number) => {
    if (!selectedItem || !user) return;

    try {
      const { error } = await supabase
        .from("user_music")
        .update({ user_rating: rating })
        .eq("user_id", user.id)
        .eq("external_id", selectedItem.id);

      if (error) throw error;

      // Update local state
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, userRating: rating } : item
        )
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, userRating: rating } : null
      );
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  const handleStatusChange = async (status: MediaDetailStatus) => {
    if (!selectedItem || !user) return;

    // Map MediaDetailStatus to MediaStatus for Music
    const musicStatus: MediaStatus =
      status === "completed" ? "saved" : "to-listen";

    try {
      const { error } = await supabase
        .from("user_music")
        .update({ user_status: musicStatus })
        .eq("user_id", user.id)
        .eq("external_id", selectedItem.id);

      if (error) throw error;

      // Update local state
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
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const searchBar = (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <MediaSearchBar
          onSearch={handleSearch}
          placeholder="Search your music collection..."
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
            <div className="text-gray-500 dark:text-gray-400">
              Loading your music...
            </div>
          </div>
        </div>
      ) : mediaItems.length === 0 ? (
        <div className={layout === "grid" ? "col-span-full" : ""}>
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
              <Plus size={48} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? "No music found" : "Add your first music"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              {searchQuery
                ? `No music matching "${searchQuery}" in your collection. Try a different search or add new music.`
                : "Start building your music collection by browsing iTunes and adding your favorite songs and albums."}
            </p>
            <button
              onClick={() => setIsBrowseModalOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Browse Music
            </button>
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
            onClick={() => setIsBrowseModalOpen(true)}
            className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Browse & Add Music
          </button>
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
          onRatingChange={(rating) => void handleRatingChange(rating)}
          onStatusChange={(status) => void handleStatusChange(status)}
        />
      )}

      <BrowseMediaModal
        isOpen={isBrowseModalOpen}
        onClose={() => setIsBrowseModalOpen(false)}
        mediaType="music"
        onAdd={handleAddMusic as (item: unknown) => Promise<void>}
        searchFunction={searchBrowseMusic}
      />
    </>
  );
};

export default Music;
