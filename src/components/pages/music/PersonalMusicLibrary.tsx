import React, { useState, useRef } from "react";
import {
  Plus,
  List,
  Check,
  Grid3x3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Music,
} from "lucide-react";
import { MediaItem } from "../../shared/SendMediaModal";
import SearchMusicModal from "../../shared/SearchMusicModal";
import Button from "../../shared/Button";
import MediaEmptyState from "../../media/MediaEmptyState";
import MediaListItem from "../../media/MediaListItem";
import SendMediaModal from "../../shared/SendMediaModal";
import Toast from "../../ui/Toast";
import { searchMusic } from "../../../utils/mediaSearchAdapters";
import {
  useMusicLibrary,
  useAddToLibrary,
  useToggleListened,
  useDeleteFromLibrary,
} from "../../../hooks/useMusicLibraryQueries";
import { useViewMode } from "../../../hooks/useViewMode";
import type { MusicLibraryItem } from "../../../services/musicService.types";
import MusicCard from "./MusicCard";

type FilterType = "all" | "listening" | "listened";
type SortType = "date-added" | "title" | "artist" | "year" | "rating";

interface PersonalMusicLibraryProps {
  initialFilter?: FilterType;
  embedded?: boolean;
}

const PersonalMusicLibrary: React.FC<PersonalMusicLibraryProps> = ({
  initialFilter = "all",
  embedded: _embedded = false,
}) => {
  // Fetch music library from database
  const { data: musicLibrary = [] } = useMusicLibrary();
  const addToLibrary = useAddToLibrary();
  const toggleListened = useToggleListened();
  const deleteFromLibrary = useDeleteFromLibrary();

  // Filter is controlled by tabs (initialFilter prop), not by dropdown
  const [filter] = useState<FilterType>(initialFilter);
  const [sortBy, setSortBy] = useState<SortType>("date-added");
  const [viewMode, setViewMode] = useViewMode("grid");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [musicToRecommend, setMusicToRecommend] =
    useState<MusicLibraryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showItemsPerPageMenu, setShowItemsPerPageMenu] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const [lastDeletedItem, setLastDeletedItem] =
    useState<MusicLibraryItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Add to library
  const handleAddToLibrary = (result: MediaItem) => {
    // If we're on the "listened" tab, mark as listened immediately
    const shouldMarkAsListened = filter === "listened";

    void addToLibrary.mutateAsync({
      external_id: result.external_id,
      title: result.title,
      artist: result.artist || "Unknown Artist",
      album: result.album || null,
      media_type:
        (result.media_type as "song" | "album" | "playlist") || "song",
      release_date: result.release_date || null,
      album_cover_url: result.poster_url,
      preview_url: null, // iTunes search doesn't provide preview URLs in basic search
      listened: shouldMarkAsListened,
    });
    setShowSearchModal(false);
  };

  // Toggle listened status
  const handleToggleListened = (id: string) => {
    void toggleListened.mutateAsync(id);
  };

  // Remove from library with undo
  const handleRemove = (music: MusicLibraryItem) => {
    setLastDeletedItem(music);
    void deleteFromLibrary.mutateAsync(music.id);
    setShowUndoToast(true);
  };

  // Undo deletion
  const handleUndo = () => {
    if (lastDeletedItem) {
      void addToLibrary.mutateAsync({
        external_id: lastDeletedItem.external_id,
        title: lastDeletedItem.title,
        artist: lastDeletedItem.artist,
        album: lastDeletedItem.album,
        media_type: lastDeletedItem.media_type,
        release_date: lastDeletedItem.release_date,
        album_cover_url: lastDeletedItem.album_cover_url,
        listened: lastDeletedItem.listened,
      });
      setLastDeletedItem(null);
    }
    setShowUndoToast(false);
  };

  // Filter music based on filter
  const filteredMusic = musicLibrary.filter((music: MusicLibraryItem) => {
    if (filter === "listening") return !music.listened;
    if (filter === "listened") return music.listened;
    return true; // "all"
  });

  // Sort music
  const sortedMusic = [...filteredMusic].sort((a, b) => {
    switch (sortBy) {
      case "date-added":
        return (
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
        );
      case "title":
        return a.title.localeCompare(b.title);
      case "artist":
        return a.artist.localeCompare(b.artist);
      case "year":
        return (
          (b.release_date ? new Date(b.release_date).getFullYear() : 0) -
          (a.release_date ? new Date(a.release_date).getFullYear() : 0)
        );
      case "rating":
        return (b.personal_rating || 0) - (a.personal_rating || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedMusic.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMusic = sortedMusic.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page
    setShowItemsPerPageMenu(false);
  };

  // Recommend music to friend
  const handleRecommend = (music: MusicLibraryItem) => {
    setMusicToRecommend(music);
    setShowSendModal(true);
  };

  const sortOptions = [
    { value: "date-added" as SortType, label: "Recently Added" },
    { value: "title" as SortType, label: "Title" },
    { value: "artist" as SortType, label: "Artist" },
    { value: "year" as SortType, label: "Release Year" },
    { value: "rating" as SortType, label: "Your Rating" },
  ];

  const itemsPerPageOptions = [10, 25, 50, 100];

  // Empty state props
  const emptyStateProps =
    filter === "listened"
      ? {
          title: "No music listened yet",
          message:
            "Mark songs and albums as listened to track your music history.",
        }
      : filter === "listening"
      ? {
          title: "Your listening queue is empty",
          message:
            "Start building your listening queue by searching for music below.",
        }
      : {
          title: "No music yet",
          message: "Add your first song or album to get started.",
        };

  return (
    <div ref={topRef} className="space-y-6">
      {/* Action Bar */}
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
                {sortBy === "artist" && "Sort: Artist"}
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
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                        sortBy === option.value
                          ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {sortBy === option.value && (
                        <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                      )}
                      {option.label}
                    </button>
                  ))}
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

        {/* Right side: Add Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowSearchModal(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Results Count */}
      {sortedMusic.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1}–{Math.min(endIndex, sortedMusic.length)} of{" "}
          {sortedMusic.length} items
        </p>
      )}

      {/* Grid/List View */}
      {currentMusic.length === 0 ? (
        <MediaEmptyState
          icon={Music}
          title={emptyStateProps.title}
          description={emptyStateProps.message}
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Search Music"
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentMusic.map((music) => (
            <MusicCard
              key={music.id}
              id={music.id}
              title={music.title}
              artist={music.artist}
              albumCoverUrl={music.album_cover_url || undefined}
              year={
                music.release_date
                  ? new Date(music.release_date).getFullYear()
                  : undefined
              }
              personalRating={music.personal_rating || undefined}
              listened={music.listened}
              onClick={() => handleRecommend(music)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {currentMusic.map((music) => (
            <MediaListItem
              key={music.id}
              id={music.id}
              title={music.title}
              subtitle={music.artist}
              posterUrl={music.album_cover_url || undefined}
              year={
                music.release_date
                  ? new Date(music.release_date).getFullYear().toString()
                  : undefined
              }
              personalRating={music.personal_rating || undefined}
              status={music.listened ? "watched" : "to-watch"}
              isCompleted={music.listened}
              onClick={() => handleRecommend(music)}
              onToggleComplete={() => handleToggleListened(music.id)}
              onRemove={() => handleRemove(music)}
              onRecommend={() => handleRecommend(music)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Items per page selector */}
          <div className="relative">
            <button
              onClick={() => setShowItemsPerPageMenu(!showItemsPerPageMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Show {itemsPerPage} items</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showItemsPerPageMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowItemsPerPageMenu(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                  {itemsPerPageOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => handleItemsPerPageChange(count)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        itemsPerPage === count
                          ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {itemsPerPage === count && (
                        <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                      )}
                      {count} items
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSearchModal && (
        <SearchMusicModal
          onClose={() => setShowSearchModal(false)}
          onSelect={handleAddToLibrary}
        />
      )}

      {showSendModal && musicToRecommend && (
        <SendMediaModal
          isOpen={true}
          onClose={() => {
            setShowSendModal(false);
            setMusicToRecommend(null);
          }}
          onSent={() => {
            setShowSendModal(false);
            setMusicToRecommend(null);
          }}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs, albums, or artists..."
          searchFunction={searchMusic}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
          preselectedItem={{
            external_id: musicToRecommend.external_id,
            title: musicToRecommend.title,
            artist: musicToRecommend.artist,
            album: musicToRecommend.album || undefined,
            media_type: musicToRecommend.media_type,
            release_date: musicToRecommend.release_date || undefined,
            poster_url: musicToRecommend.album_cover_url || null,
          }}
        />
      )}

      {/* Undo Toast */}
      {showUndoToast && (
        <Toast
          message={`Removed ${lastDeletedItem?.title || "item"} from library`}
          action={{
            label: "Undo",
            onClick: handleUndo,
          }}
          onClose={() => setShowUndoToast(false)}
        />
      )}
    </div>
  );
};

export default PersonalMusicLibrary;
