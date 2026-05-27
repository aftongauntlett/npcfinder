import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Film,
  MessageSquare,
  RotateCcw,
  Trash2,
} from "lucide-react";
import AppLayout from "@/components/layouts/AppLayout";
import AddMediaFromCatalogModal from "@/components/media/AddMediaFromCatalogModal";
import {
  Button,
  ConfirmationModal,
  EmptyState,
  MediaPageToolbar,
  MediaPoster,
  Modal,
  Textarea,
} from "@/components/shared";
import Toast from "@/components/ui/Toast";
import {
  TRACKER_SCOPES,
  mediaTypeAllowedInScope,
  resolveTrackerScope,
  type TrackerMediaType,
  type TrackerScopeId,
} from "@/data/trackerScopes";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  useAddTrackerItem,
  useRemoveTrackerItem,
  useTrackerItems,
  useUpdateTrackerItem,
} from "@/hooks/useTrackerQueries";
import {
  getBookDetailsWithCache,
  getGameDetailsWithCache,
  getMediaDetailsWithCache,
} from "@/services/mediaDetailsWithCache";
import type {
  BookDetailedInfo,
  GameDetailedInfo,
} from "@/services/mediaDetailsCacheService";
import type { DetailedMediaInfo } from "@/utils/tmdbDetails";
import type { TrackerItem, TrackerStatus } from "@/services/trackerService";

const PAGE_META_BASE = {
  noIndex: true,
};

type ViewMode = "active" | "history";
type MediaFilter = "all" | TrackerMediaType;
type SortMode = "recent" | "title" | "year" | "added" | "completed";

function mediaLabel(mediaType: string | undefined): string {
  if (!mediaType) return "Unknown";
  if (mediaType === "tv") return "TV";
  if (mediaType === "song") return "Song";
  if (mediaType === "album") return "Album";
  if (mediaType === "game") return "Game";
  if (mediaType === "book") return "Book";
  if (mediaType === "movie") return "Movie";
  if (mediaType === "playlist") return "Playlist";
  return mediaType;
}

function toggleLabel(status: TrackerStatus): string {
  return status === "done" ? "Move To Active" : "Mark Complete";
}

function toggleButtonClassName(status: TrackerStatus): string {
  if (status === "done") {
    return "h-9 w-9 rounded-full border-0 shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-600/80";
  }

  return "h-9 w-9 rounded-full border-0 shadow-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/25 dark:text-emerald-100 dark:hover:bg-emerald-500/35";
}

function deleteButtonClassName(): string {
  return "h-9 w-9 rounded-full border-0 shadow-sm bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/25 dark:text-rose-100 dark:hover:bg-rose-500/35";
}

function mediaTypeChipClassName(mediaType: string | undefined): string {
  if (mediaType === "movie") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-100";
  }

  if (mediaType === "tv") {
    return "bg-orange-100 text-orange-700 dark:bg-orange-500/25 dark:text-orange-100";
  }

  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
}

function formatTrackDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPlaytime(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "-";
  }

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }

  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hrs`;
}

function formatReleaseDate(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TrackerMediaCard(props: {
  item: TrackerItem;
  onOpen: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  const { item, onOpen, onToggleStatus, onDelete, isBusy } = props;
  const hasNote = (item.note || "").trim().length > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-3 sm:p-4 hover:border-primary/50 dark:hover:border-primary-light/50 transition-colors cursor-pointer"
      aria-label={`Open details for ${item.media?.title || "Untitled"}`}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <MediaPoster
            src={item.media?.poster_url}
            alt={item.media?.title || "Untitled"}
            size="sm"
            aspectRatio="2/3"
            showOverlay={false}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              {item.media?.title || "Untitled"}
            </h3>

            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${mediaTypeChipClassName(
                item.media?.media_type,
              )}`}
            >
              {mediaLabel(item.media?.media_type)}
            </span>

            {hasNote && (
              <span
                className="inline-flex items-center text-amber-500 dark:text-amber-300"
                title="Has note"
                aria-label="Has note"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {item.media?.subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {item.media.subtitle}
            </p>
          )}

          {item.media?.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.media.description}
            </p>
          )}
        </div>

        <div className="sm:self-center flex items-center gap-2">
          <Button
            variant="subtle"
            size="icon"
            icon={
              item.status === "done" ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )
            }
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStatus();
            }}
            aria-label={toggleLabel(item.status)}
            title={toggleLabel(item.status)}
            className={toggleButtonClassName(item.status)}
          />

          <Button
            variant="subtle"
            size="icon"
            icon={<Trash2 className="w-4 h-4" />}
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label="Remove from tracker"
            title="Remove from tracker"
            className={deleteButtonClassName()}
          />
        </div>
      </div>
    </div>
  );
}

function TrackerDetailsModal(props: {
  item: TrackerItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSaveNote: (item: TrackerItem, note: string) => Promise<void>;
}) {
  const { item, isSaving, onClose, onSaveNote } = props;
  const [note, setNote] = useState("");
  const [movieTvDetails, setMovieTvDetails] =
    useState<DetailedMediaInfo | null>(null);
  const [bookDetails, setBookDetails] = useState<BookDetailedInfo | null>(null);
  const [gameDetails, setGameDetails] = useState<GameDetailedInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    setNote(item?.note || "");
  }, [item?.id, item?.note]);

  useEffect(() => {
    let cancelled = false;

    setMovieTvDetails(null);
    setBookDetails(null);
    setGameDetails(null);

    const mediaType = item?.media?.media_type;
    const externalId = item?.media?.external_id;

    if (!mediaType || !externalId) {
      setIsLoadingDetails(false);
      return () => {
        cancelled = true;
      };
    }

    if (
      mediaType !== "movie" &&
      mediaType !== "tv" &&
      mediaType !== "book" &&
      mediaType !== "game"
    ) {
      setIsLoadingDetails(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingDetails(true);

    void (async () => {
      try {
        if (mediaType === "movie" || mediaType === "tv") {
          const details = await getMediaDetailsWithCache(externalId, mediaType);
          if (!cancelled) {
            setMovieTvDetails(details);
          }
          return;
        }

        if (mediaType === "book") {
          const details = await getBookDetailsWithCache(externalId);
          if (!cancelled) {
            setBookDetails(details);
          }
          return;
        }

        const details = await getGameDetailsWithCache(externalId);
        if (!cancelled) {
          setGameDetails(details);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDetails(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.media?.external_id, item?.media?.media_type]);

  if (!item) {
    return null;
  }

  const handleSaveAndClose = async () => {
    await onSaveNote(item, note);
    onClose();
  };

  const noteChanged = note.trim() !== (item.note || "").trim();
  const mediaType = item.media?.media_type;

  const detailRows: Array<{
    label: string;
    value: string;
    fullWidth?: boolean;
  }> = [];

  const mediaGenres =
    movieTvDetails?.genres?.join(", ") ||
    gameDetails?.genres ||
    item.media?.genres;

  const releaseDate =
    movieTvDetails?.release_date ||
    bookDetails?.release_date ||
    gameDetails?.release_date ||
    item.media?.release_date;

  const releaseLabel = formatReleaseDate(releaseDate);
  if (releaseLabel) {
    detailRows.push({ label: "Release", value: releaseLabel });
  }

  if (mediaGenres) {
    detailRows.push({ label: "Genre", value: mediaGenres });
  }

  if (mediaType === "movie" || mediaType === "tv") {
    if (movieTvDetails?.director) {
      detailRows.push({ label: "Director", value: movieTvDetails.director });
    }

    if (movieTvDetails?.cast?.length) {
      detailRows.push({
        label: "Cast",
        value: movieTvDetails.cast.slice(0, 8).join(", "),
        fullWidth: true,
      });
    }

    if (movieTvDetails?.runtime) {
      detailRows.push({
        label: "Runtime",
        value: `${movieTvDetails.runtime} min`,
      });
    }

    if (movieTvDetails?.imdb_rating) {
      detailRows.push({
        label: "IMDb",
        value: `${movieTvDetails.imdb_rating}/10`,
      });
    }

    if (movieTvDetails?.rotten_tomatoes_score) {
      detailRows.push({
        label: "Rotten Tomatoes",
        value: `${movieTvDetails.rotten_tomatoes_score}%`,
      });
    }

    if (movieTvDetails?.metacritic_score) {
      detailRows.push({
        label: "Metacritic",
        value: `${movieTvDetails.metacritic_score}/100`,
      });
    }
  }

  if (mediaType === "book") {
    const authors = bookDetails?.authors || item.media?.authors;
    const publisher = bookDetails?.publisher || item.media?.publisher;
    const categories = bookDetails?.categories;
    const pageCount = bookDetails?.page_count || item.media?.page_count;
    const isbn = bookDetails?.isbn || item.media?.isbn;

    if (authors) {
      detailRows.push({ label: "Author", value: authors, fullWidth: true });
    }

    if (publisher) {
      detailRows.push({ label: "Publisher", value: publisher });
    }

    if (pageCount) {
      detailRows.push({ label: "Pages", value: String(pageCount) });
    }

    if (bookDetails?.average_rating) {
      detailRows.push({
        label: "Avg Rating",
        value: `${bookDetails.average_rating.toFixed(1)}/5`,
      });
    }

    if (categories) {
      detailRows.push({
        label: "Category",
        value: categories,
        fullWidth: true,
      });
    }

    if (isbn) {
      detailRows.push({ label: "ISBN", value: isbn, fullWidth: true });
    }
  }

  if (mediaType === "game") {
    const platforms = gameDetails?.platforms || item.media?.platforms;
    const metacritic = gameDetails?.metacritic || item.media?.metacritic;
    const rating = gameDetails?.rating;
    const playtime = gameDetails?.playtime || item.media?.playtime;

    if (platforms) {
      detailRows.push({
        label: "Platforms",
        value: platforms,
        fullWidth: true,
      });
    }

    if (metacritic) {
      detailRows.push({ label: "Metacritic", value: `${metacritic}/100` });
    }

    if (rating) {
      detailRows.push({ label: "Rating", value: `${rating.toFixed(1)}/5` });
    }

    if (playtime) {
      detailRows.push({
        label: "Avg Playtime",
        value: formatPlaytime(playtime),
      });
    }
  }

  if (
    mediaType === "song" ||
    mediaType === "album" ||
    mediaType === "playlist"
  ) {
    if (item.media?.artist) {
      detailRows.push({
        label: "Artist",
        value: item.media.artist,
        fullWidth: true,
      });
    }

    if (item.media?.album && mediaType === "song") {
      detailRows.push({
        label: "Album",
        value: item.media.album,
        fullWidth: true,
      });
    }

    if (item.media?.track_count && mediaType !== "song") {
      detailRows.push({
        label: "Tracks",
        value: String(item.media.track_count),
      });
    }

    if (item.media?.track_duration && mediaType === "song") {
      detailRows.push({
        label: "Duration",
        value: formatTrackDuration(item.media.track_duration),
      });
    }
  }

  const compactDetailRows = detailRows.filter((row) => !row.fullWidth);
  const fullWidthDetailRows = detailRows.filter((row) => row.fullWidth);
  const leftColumnRows = compactDetailRows.filter(
    (_, index) => index % 2 === 0,
  );
  const rightColumnRows = compactDetailRows.filter(
    (_, index) => index % 2 === 1,
  );

  return (
    <Modal
      isOpen={Boolean(item)}
      onClose={onClose}
      title={item.media?.title || "Tracker Item"}
      maxWidth="4xl"
    >
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <MediaPoster
              src={item.media?.poster_url}
              alt={item.media?.title || "Untitled"}
              size="md"
              aspectRatio="2/3"
              showOverlay={false}
              className="w-40"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {item.media?.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.media.subtitle}
              </p>
            )}

            {item.media?.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.media.description}
              </p>
            )}

            {(detailRows.length > 0 || isLoadingDetails) && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60 p-3">
                <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  More Details
                </h4>

                {isLoadingDetails ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading details...
                  </p>
                ) : (
                  <div className="space-y-3">
                    {compactDetailRows.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <dl className="space-y-2">
                          {leftColumnRows.map((row) => (
                            <div key={`${row.label}-${row.value}`}>
                              <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {row.label}
                              </dt>
                              <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>

                        <dl className="space-y-2">
                          {rightColumnRows.map((row) => (
                            <div key={`${row.label}-${row.value}`}>
                              <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {row.label}
                              </dt>
                              <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {fullWidthDetailRows.length > 0 && (
                      <dl className="space-y-2 border-t border-gray-200/80 dark:border-gray-700/80 pt-3">
                        {fullWidthDetailRows.map((row) => (
                          <div key={`${row.label}-${row.value}`}>
                            <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              {row.label}
                            </dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Textarea
            id={`tracker-note-${item.id}`}
            label="Personal Note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Private note about this item"
            rows={4}
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              disabled={!noteChanged || isSaving}
              onClick={() => void handleSaveAndClose()}
            >
              Save Note
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface TrackerPageProps {
  scope?: TrackerScopeId;
}

export default function TrackerPage({ scope }: TrackerPageProps) {
  const resolvedScope = resolveTrackerScope(scope);
  const scopeConfig = TRACKER_SCOPES[resolvedScope];

  usePageMeta({
    ...PAGE_META_BASE,
    title: scopeConfig.pageTitle,
    description: scopeConfig.pageDescription,
  });

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMediaFilter("all");
    setSearchQuery("");
    setSelectedItemId(null);
    setPendingDeleteId(null);
    setToast(null);
    setViewMode("active");
  }, [resolvedScope]);

  const { data: activeItems = [], isLoading: activeLoading } =
    useTrackerItems("active");
  const { data: historyItems = [], isLoading: historyLoading } =
    useTrackerItems("done");

  const addTrackerItem = useAddTrackerItem();
  const updateTrackerItem = useUpdateTrackerItem();
  const removeTrackerItem = useRemoveTrackerItem();

  const scopedActiveItems = useMemo(
    () =>
      activeItems.filter((item) =>
        mediaTypeAllowedInScope(item.media?.media_type, resolvedScope),
      ),
    [activeItems, resolvedScope],
  );

  const scopedHistoryItems = useMemo(
    () =>
      historyItems.filter((item) =>
        mediaTypeAllowedInScope(item.media?.media_type, resolvedScope),
      ),
    [historyItems, resolvedScope],
  );

  const trackerItems =
    viewMode === "history" ? scopedHistoryItems : scopedActiveItems;
  const allTrackerItems = useMemo(
    () => [...scopedActiveItems, ...scopedHistoryItems],
    [scopedActiveItems, scopedHistoryItems],
  );
  const isLoading = viewMode === "history" ? historyLoading : activeLoading;

  const filteredItems = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    const filteredByType =
      mediaFilter === "all"
        ? trackerItems
        : trackerItems.filter((item) => item.media?.media_type === mediaFilter);

    const searched =
      search.length === 0
        ? filteredByType
        : filteredByType.filter((item) => {
            const haystack = [
              item.media?.title || "",
              item.media?.subtitle || "",
              item.media?.description || "",
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(search);
          });

    const sorted = [...searched];

    sorted.sort((a, b) => {
      if (sortMode === "title") {
        return (a.media?.title || "").localeCompare(b.media?.title || "");
      }

      if (sortMode === "year") {
        return (b.media?.year || 0) - (a.media?.year || 0);
      }

      if (sortMode === "added") {
        return (b.created_at || "").localeCompare(a.created_at || "");
      }

      if (sortMode === "completed") {
        return (b.completed_at || "").localeCompare(a.completed_at || "");
      }

      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });

    return sorted;
  }, [trackerItems, mediaFilter, searchQuery, sortMode]);

  const existingItems = useMemo(
    () =>
      allTrackerItems
        .filter((item) => item.media)
        .map((item) => ({
          external_id: item.media?.external_id || "",
          media_type: item.media?.media_type || "",
        })),
    [allTrackerItems],
  );

  const selectedItem = useMemo(
    () => allTrackerItems.find((item) => item.id === selectedItemId) || null,
    [allTrackerItems, selectedItemId],
  );

  const pendingDeleteItem = useMemo(
    () => allTrackerItems.find((item) => item.id === pendingDeleteId) || null,
    [allTrackerItems, pendingDeleteId],
  );

  const filterSections = useMemo(
    () => [
      {
        id: "mediaType",
        title: "Media Type",
        options: [
          { id: "all", label: `All ${scopeConfig.label}` },
          ...scopeConfig.mediaTypes.map((mediaType) => ({
            id: mediaType,
            label: mediaLabel(mediaType),
          })),
        ],
      },
      {
        id: "sort",
        title: "Sort By",
        options: [
          { id: "recent", label: "Recently Updated" },
          { id: "title", label: "Title (A-Z)" },
          { id: "year", label: "Year" },
          { id: "added", label: "Date Added" },
          { id: "completed", label: "Completed Date" },
        ],
      },
    ],
    [scopeConfig.label, scopeConfig.mediaTypes],
  );

  const handleToggleStatus = async (item: TrackerItem) => {
    const nextStatus: TrackerStatus =
      item.status === "done" ? "in_progress" : "done";

    await updateTrackerItem.mutateAsync({
      trackerItemId: item.id,
      updates: { status: nextStatus },
    });

    setToast({
      message: nextStatus === "done" ? "Moved to history" : "Moved to active",
    });
  };

  const handleSaveNote = async (item: TrackerItem, note: string) => {
    const trimmed = note.trim();

    await updateTrackerItem.mutateAsync({
      trackerItemId: item.id,
      updates: { note: trimmed.length > 0 ? trimmed : null },
    });
  };

  const handleRequestDelete = (item: TrackerItem) => {
    setPendingDeleteId(item.id);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) {
      return;
    }

    await removeTrackerItem.mutateAsync(pendingDeleteId);

    if (selectedItemId === pendingDeleteId) {
      setSelectedItemId(null);
    }

    setPendingDeleteId(null);
  };

  const isItemActionPending =
    updateTrackerItem.isPending || removeTrackerItem.isPending;

  const tabs = [
    {
      id: "active",
      label: "Active",
      badge: scopedActiveItems.length,
    },
    {
      id: "history",
      label: "History",
      badge: scopedHistoryItems.length,
    },
  ];

  return (
    <AppLayout
      title={scopeConfig.pageTitle}
      description={scopeConfig.pageDescription}
      tabs={tabs}
      activeTab={viewMode}
      onTabChange={(tabId) => setViewMode(tabId as ViewMode)}
    >
      <div className="container mx-auto px-4 sm:px-6 space-y-4">
        <MediaPageToolbar
          filterConfig={{
            type: "menu",
            sections: filterSections,
            activeFilters: {
              mediaType: mediaFilter,
              sort: sortMode,
            },
            onFilterChange: (sectionId, filterId) => {
              if (sectionId === "mediaType") {
                setMediaFilter(filterId as MediaFilter);
              }

              if (sectionId === "sort") {
                setSortMode(filterId as SortMode);
              }
            },
          }}
          searchConfig={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: `Search ${scopeConfig.label}...`,
          }}
          onAddClick={() => setShowAddModal(true)}
          addLabel="+ Add"
        />

        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading tracker...
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={viewMode === "history" ? BookOpen : Film}
            title={
              viewMode === "history"
                ? "No history yet"
                : "Nothing active right now"
            }
            description={
              searchQuery || mediaFilter !== "all"
                ? "No tracker items match your current search and filters."
                : viewMode === "history"
                  ? "Mark items as watched to build your timeline."
                  : `Add ${scopeConfig.label.toLowerCase()} and start tracking.`
            }
          />
        ) : (
          <div className="space-y-3 pb-2">
            {filteredItems.map((item) => (
              <TrackerMediaCard
                key={item.id}
                item={item}
                isBusy={isItemActionPending}
                onOpen={() => setSelectedItemId(item.id)}
                onToggleStatus={() => void handleToggleStatus(item)}
                onDelete={() => handleRequestDelete(item)}
              />
            ))}
          </div>
        )}
      </div>

      <TrackerDetailsModal
        item={selectedItem}
        isSaving={updateTrackerItem.isPending}
        onClose={() => setSelectedItemId(null)}
        onSaveNote={handleSaveNote}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingDeleteItem)}
        onClose={() => {
          if (!removeTrackerItem.isPending) {
            setPendingDeleteId(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove from tracker?"
        message={`Are you sure you want to remove "${pendingDeleteItem?.media?.title || "this item"}" from your tracker?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={removeTrackerItem.isPending}
      />

      <AddMediaFromCatalogModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add ${scopeConfig.label} To Tracker`}
        emptyHint={`Search ${scopeConfig.label.toLowerCase()} to add to this tracker.`}
        addLabel="Track"
        searchScope={scopeConfig.searchScope}
        lockSearchScope={true}
        searchPlaceholder={`Search ${scopeConfig.label.toLowerCase()}...`}
        existingItems={existingItems}
        onAdd={async (item) => {
          await addTrackerItem.mutateAsync({ item });
        }}
      />

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  );
}
