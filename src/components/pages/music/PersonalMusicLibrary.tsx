import React, { useState, useRef } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Music,
} from "lucide-react";
import { MediaItem } from "../../shared/media/SendMediaModal";
import SearchMusicModal from "../../shared/search/SearchMusicModal";
import MusicDetailModal from "./MusicDetailModal";
import MediaEmptyState from "../../media/MediaEmptyState";
import MediaListItem from "../../media/MediaListItem";
import SendMediaModal from "../../shared/media/SendMediaModal";
import Toast from "../../ui/Toast";
import Button from "../../shared/ui/Button";
import { MediaPageToolbar } from "../../shared/media/MediaPageToolbar";
import { searchMusic } from "../../../utils/mediaSearchAdapters";
import {
  useMusicLibrary,
  useAddToLibrary,
  useToggleListened,
  useDeleteFromLibrary,
} from "../../../hooks/useMusicLibraryQueries";
import type { MusicLibraryItem } from "../../../services/musicService.types";

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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicLibraryItem | null>(
    null
  );
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
      genre: result.genre || null,
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
        genre: lastDeletedItem.genre,
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
    { id: "date-added" as SortType, label: "Recently Added" },
    { id: "title" as SortType, label: "Title" },
    { id: "artist" as SortType, label: "Artist" },
    { id: "year" as SortType, label: "Release Year" },
    { id: "rating" as SortType, label: "Your Rating" },
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
      {/* Action Bar - Only show when there's data */}
      {sortedMusic.length > 0 && (
        <MediaPageToolbar
          filterConfig={{
            type: "menu",
            sections: [
              {
                id: "sort",
                title: "Sort By",
                options: sortOptions,
              },
            ],
            activeFilters: {
              sort: sortBy,
            },
            onFilterChange: (sectionId, filterId) => {
              if (sectionId === "sort") {
                setSortBy(filterId as SortType);
              }
            },
          }}
          onAddClick={() => setShowSearchModal(true)}
        />
      )}

      {/* Results Count */}
      {sortedMusic.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1}–{Math.min(endIndex, sortedMusic.length)} of{" "}
          {sortedMusic.length} items
        </p>
      )}

      {/* List View */}
      {currentMusic.length === 0 ? (
        <MediaEmptyState
          icon={Music}
          title={emptyStateProps.title}
          description={emptyStateProps.message}
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Search Music"
        />
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
              genres={music.genre || undefined}
              onClick={() => setSelectedMusic(music)}
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
            <Button
              onClick={() => setShowItemsPerPageMenu(!showItemsPerPageMenu)}
              variant="secondary"
              size="sm"
              icon={<ChevronDown className="w-4 h-4" />}
              iconPosition="right"
              aria-expanded={showItemsPerPageMenu}
            >
              <span>Show {itemsPerPage} items</span>
            </Button>

            {showItemsPerPageMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowItemsPerPageMenu(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                  {itemsPerPageOptions.map((count) => (
                    <Button
                      key={count}
                      onClick={() => handleItemsPerPageChange(count)}
                      variant="subtle"
                      size="sm"
                      fullWidth
                      className={`justify-start px-4 py-2 ${
                        itemsPerPage === count
                          ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                          : ""
                      }`}
                    >
                      {itemsPerPage === count && (
                        <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                      )}
                      {count} items
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="subtle"
              size="icon"
              icon={<ChevronLeft className="w-5 h-5" />}
              aria-label="Previous page"
            />

            <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="subtle"
              size="icon"
              icon={<ChevronRight className="w-5 h-5" />}
              aria-label="Next page"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedMusic && (
        <MusicDetailModal
          music={selectedMusic}
          onClose={() => setSelectedMusic(null)}
          onToggleListened={() => {
            handleToggleListened(selectedMusic.id);
            setSelectedMusic(null);
          }}
          onRemove={() => {
            handleRemove(selectedMusic);
            setSelectedMusic(null);
          }}
        />
      )}

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
