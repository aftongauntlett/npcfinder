import React, { useState, useRef, useMemo } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Music,
} from "lucide-react";
import Chip from "../../shared/ui/Chip";
import { FilterSortSection } from "../../shared/common/FilterSortMenu";
import { MediaItem } from "../../shared/media/SendMediaModal";
import SearchMusicModal from "../../shared/search/SearchMusicModal";
import MusicDetailModal from "./MusicDetailModal";
import MediaEmptyState from "../../media/MediaEmptyState";
import MediaListItem from "../../media/MediaListItem";
import SendMediaModal from "../../shared/media/SendMediaModal";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
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
  const [genreFilters, setGenreFilters] = useState<string[]>(["all"]);
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

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [musicToDelete, setMusicToDelete] = useState<MusicLibraryItem | null>(
    null
  );

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
      preview_url: result.preview_url || null,
      genre: result.genre || null,
      track_duration: result.track_duration || null,
      track_count: result.track_count || null,
      listened: shouldMarkAsListened,
    });
    setShowSearchModal(false);
  };

  // Toggle listened status
  const handleToggleListened = (id: string) => {
    void toggleListened.mutateAsync(id);
  };

  // Remove from library
  const handleRemove = (music: MusicLibraryItem) => {
    setMusicToDelete(music);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!musicToDelete) return;

    try {
      await deleteFromLibrary.mutateAsync(musicToDelete.id);
      setShowDeleteModal(false);
      setMusicToDelete(null);
    } catch (error) {
      console.error("Failed to delete from music library:", error);
      // Keep modal open so user sees the action failed
    }
  };

  // First, filter by listened status to get the current view
  const filteredByStatus = useMemo(() => {
    if (filter === "listening") return musicLibrary.filter((m) => !m.listened);
    if (filter === "listened") return musicLibrary.filter((m) => m.listened);
    return musicLibrary;
  }, [musicLibrary, filter]);

  // Extract unique genres from the currently filtered music (by listened status)
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    filteredByStatus.forEach((music) => {
      if (music.genre) {
        // Split comma-separated genres and trim whitespace
        music.genre.split(",").forEach((genre) => {
          const trimmedGenre = genre.trim().toLowerCase();
          if (trimmedGenre) genreSet.add(trimmedGenre);
        });
      }
    });
    return genreSet;
  }, [filteredByStatus]);

  // Create filter & sort sections for FilterSortMenu
  const filterSortSections = useMemo((): FilterSortSection[] => {
    // Sort options
    const sortOptions = [
      { id: "date-added" as SortType, label: "Recently Added" },
      { id: "title" as SortType, label: "Title" },
      { id: "artist" as SortType, label: "Artist" },
      { id: "year" as SortType, label: "Release Year" },
      { id: "rating" as SortType, label: "Your Rating" },
    ];

    // Sort genres alphabetically
    const sortedGenres = Array.from(availableGenres).sort();

    const genreOptions = [
      { id: "all", label: "All Genres" },
      ...sortedGenres.map((genre) => ({
        id: genre,
        label: genre.charAt(0).toUpperCase() + genre.slice(1),
      })),
    ];

    return [
      {
        id: "genre",
        title: "Genre",
        multiSelect: true,
        options: genreOptions,
      },
      {
        id: "sort",
        title: "Sort By",
        options: sortOptions,
      },
    ];
  }, [availableGenres]);

  // Filter music based on filter and genre
  const filteredMusic = filteredByStatus.filter((music: MusicLibraryItem) => {
    // Filter by genres (multiple selection support)
    if (genreFilters.length === 0 || genreFilters.includes("all")) {
      return true;
    }

    // Music matches if it matches ANY of the selected genres
    if (music.genre) {
      const musicGenres = music.genre
        .toLowerCase()
        .split(",")
        .map((g) => g.trim());

      return genreFilters.some((selectedGenre) =>
        musicGenres.includes(selectedGenre)
      );
    }

    return false;
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

  const itemsPerPageOptions = [10, 25, 50, 100];

  // Empty state props
  const emptyStateProps =
    filter === "listened"
      ? {
          title: "Your Music list is empty",
          message:
            "You haven't added any albums or songs to your list yet. Add music to start tracking what you're currently listening to!",
        }
      : filter === "listening"
      ? {
          title: "Your Music list is empty",
          message:
            "You haven't added any albums or songs to your list yet. Add music to start tracking what you're currently listening to!",
        }
      : {
          title: "Your Music list is empty",
          message:
            "You haven't added any albums or songs to your list yet. Add music to start tracking what you're currently listening to!",
        };

  return (
    <div
      ref={topRef}
      className="container mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6"
    >
      {/* Action Bar - Only show when there's data */}
      {sortedMusic.length > 0 && (
        <div className="space-y-3">
          <MediaPageToolbar
            filterConfig={{
              type: "menu",
              sections: filterSortSections,
              activeFilters: {
                genre: genreFilters,
                sort: sortBy,
              },
              onFilterChange: (sectionId, value) => {
                if (sectionId === "genre") {
                  const genres = Array.isArray(value) ? value : [value];
                  setGenreFilters(genres);
                } else if (sectionId === "sort") {
                  setSortBy(value as SortType);
                }
              },
            }}
            onAddClick={() => setShowSearchModal(true)}
          />

          {/* Active Filter Chips */}
          {!genreFilters.includes("all") && genreFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genreFilters.map((genre) => (
                <Chip
                  key={genre}
                  variant="primary"
                  size="sm"
                  rounded="full"
                  removable
                  onRemove={() => {
                    const newFilters = genreFilters.filter((g) => g !== genre);
                    setGenreFilters(
                      newFilters.length > 0 ? newFilters : ["all"]
                    );
                  }}
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </Chip>
              ))}
            </div>
          )}
        </div>
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
              isCompleted={music.listened}
              genres={music.genre || undefined}
              mediaType={music.media_type}
              artist={music.artist}
              album={music.album || undefined}
              trackDuration={music.track_duration || undefined}
              trackCount={music.track_count || undefined}
              previewUrl={music.preview_url || undefined}
              externalId={music.external_id}
              description={undefined}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMusicToDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove from Library?"
        message={
          musicToDelete
            ? `Are you sure you want to remove "${musicToDelete.title}" by ${musicToDelete.artist} from your library?`
            : ""
        }
        confirmText="Remove"
        variant="danger"
        isLoading={deleteFromLibrary.isPending}
      />
    </div>
  );
};

export default PersonalMusicLibrary;
