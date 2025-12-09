import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Music } from "lucide-react";
import { Pagination } from "../../shared/common/Pagination";
import { FilterSortSection } from "../../shared/common/FilterSortMenu";
import { MediaItem } from "../../shared/media/SendMediaModal";
import SearchMusicModal from "../../shared/search/SearchMusicModal";
import MusicDetailModal from "./MusicDetailModal";
import { EmptyStateAddCard } from "../../shared";
import MediaListItem from "../../media/MediaListItem";
import SendMediaModal from "../../shared/media/SendMediaModal";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import { MediaPageToolbar } from "../../shared/media/MediaPageToolbar";
import { searchMusic } from "../../../utils/mediaSearchAdapters";
import { logger } from "@/lib/logger";
import { usePagination } from "../../../hooks/usePagination";
import { useUrlPaginationState } from "../../../hooks/useUrlPaginationState";
import {
  useMusicLibrary,
  useAddToLibrary,
  useToggleListened,
  useDeleteFromLibrary,
} from "../../../hooks/useMusicLibraryQueries";
import type { MusicLibraryItem } from "../../../services/musicService.types";
import {
  getPersistedFilters,
  persistFilters,
} from "../../../utils/persistenceUtils";

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

  // Load persisted filter state
  const persistenceKey = "musicLibrary";
  const persistedFilters = getPersistedFilters(persistenceKey, {
    genreFilters: ["all"],
    sortBy: "date-added",
    itemsPerPage: 10,
  });

  // Filter is controlled by tabs (initialFilter prop), not by dropdown
  const [filter] = useState<FilterType>(initialFilter);
  const [genreFilters, setGenreFilters] = useState<string[]>(
    persistedFilters.genreFilters as string[]
  );
  const [sortBy, setSortBy] = useState<SortType>(
    persistedFilters.sortBy as SortType
  );
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicLibraryItem | null>(
    null
  );
  const [musicToRecommend, setMusicToRecommend] =
    useState<MusicLibraryItem | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [musicToDelete, setMusicToDelete] = useState<MusicLibraryItem | null>(
    null
  );

  // Persist filter changes (removed itemsPerPage - now handled by usePagination)
  useEffect(() => {
    persistFilters(persistenceKey, {
      genreFilters,
      sortBy,
    });
  }, [genreFilters, sortBy]);

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
      logger.error("Failed to delete music", {
        error,
        musicId: musicToDelete.id,
      });
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

  // Filter and sort functions (stable references for usePagination memoization)
  const filterFn = useCallback(
    (music: MusicLibraryItem) => {
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
    },
    [genreFilters]
  );

  const sortFn = useCallback(
    (a: MusicLibraryItem, b: MusicLibraryItem) => {
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
    },
    [sortBy]
  );

  // URL-based pagination state
  const { page, perPage, setPage, setPerPage } = useUrlPaginationState(1, 10);

  // Use pagination hook with URL state for bookmarkable pages
  const pagination = usePagination({
    items: filteredByStatus,
    filterFn,
    sortFn,
    initialPage: page,
    initialItemsPerPage: perPage,
    persistenceKey,
    onPageChange: setPage,
    onItemsPerPageChange: setPerPage,
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      pagination.goToPage(newPage);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [pagination]
  );

  const handleItemsPerPageChange = useCallback(
    (count: number) => {
      pagination.setItemsPerPage(count);
    },
    [pagination]
  );

  // Recommend music to friend
  const handleRecommend = (music: MusicLibraryItem) => {
    setMusicToRecommend(music);
    setShowSendModal(true);
  };

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
      {pagination.filteredItems.length > 0 && (
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
        </div>
      )}

      {/* List View */}
      {pagination.paginatedItems.length === 0 ? (
        <EmptyStateAddCard
          icon={Music}
          title={emptyStateProps.title}
          description={emptyStateProps.message}
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Search Music"
        />
      ) : (
        <div className="space-y-2">
          {pagination.paginatedItems.map((music: MusicLibraryItem) => (
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
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.filteredItems.length}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

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
