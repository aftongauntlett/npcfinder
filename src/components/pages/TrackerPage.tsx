import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Film, Plus, RotateCcw } from "lucide-react";
import AppLayout from "@/components/layouts/AppLayout";
import AddMediaFromCatalogModal from "@/components/media/AddMediaFromCatalogModal";
import {
  Button,
  EmptyState,
  MediaPageToolbar,
  MediaPoster,
  Modal,
  Textarea,
} from "@/components/shared";
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
  useTrackerItems,
  useUpdateTrackerItem,
} from "@/hooks/useTrackerQueries";
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

function getYearLabel(item: TrackerItem): string | null {
  if (item.media?.year) return String(item.media.year);
  if (item.media?.release_date) {
    const value = Number(item.media.release_date.split("-")[0]);
    if (Number.isFinite(value)) return String(value);
  }
  return null;
}

function TrackerMediaCard(props: {
  item: TrackerItem;
  onOpen: () => void;
  onToggleStatus: () => void;
  isBusy: boolean;
}) {
  const { item, onOpen, onToggleStatus, isBusy } = props;
  const year = getYearLabel(item);

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

            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {mediaLabel(item.media?.media_type)}
            </span>

            {year && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {year}
              </span>
            )}
          </div>

          {item.media?.subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {item.media.subtitle}
            </p>
          )}

          {item.note ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              <span className="font-medium text-gray-900 dark:text-gray-200">
                Note:
              </span>{" "}
              {item.note}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No note yet. Click to add one.
            </p>
          )}

          {item.media?.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.media.description}
            </p>
          )}
        </div>

        <div className="sm:self-center">
          <Button
            variant={item.status === "done" ? "secondary" : "primary"}
            size="sm"
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
          >
            {toggleLabel(item.status)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TrackerDetailsModal(props: {
  item: TrackerItem | null;
  isSaving: boolean;
  onClose: () => void;
  onToggleStatus: (item: TrackerItem) => Promise<void>;
  onSaveNote: (item: TrackerItem, note: string) => Promise<void>;
}) {
  const { item, isSaving, onClose, onToggleStatus, onSaveNote } = props;
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(item?.note || "");
  }, [item?.id, item?.note]);

  if (!item) {
    return null;
  }

  const noteChanged = note.trim() !== (item.note || "").trim();

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
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {mediaLabel(item.media?.media_type)}
              </span>
              {getYearLabel(item) && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getYearLabel(item)}
                </span>
              )}
            </div>

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

            <Button
              variant={item.status === "done" ? "secondary" : "primary"}
              size="sm"
              icon={
                item.status === "done" ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )
              }
              disabled={isSaving}
              onClick={() => void onToggleStatus(item)}
            >
              {toggleLabel(item.status)}
            </Button>
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
              onClick={() => void onSaveNote(item, note)}
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
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMediaFilter("all");
    setSearchQuery("");
    setSelectedItemId(null);
    setViewMode("active");
  }, [resolvedScope]);

  const { data: activeItems = [], isLoading: activeLoading } =
    useTrackerItems("active");
  const { data: historyItems = [], isLoading: historyLoading } =
    useTrackerItems("done");

  const addTrackerItem = useAddTrackerItem();
  const updateTrackerItem = useUpdateTrackerItem();

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
  };

  const handleSaveNote = async (item: TrackerItem, note: string) => {
    const trimmed = note.trim();

    await updateTrackerItem.mutateAsync({
      trackerItemId: item.id,
      updates: { note: trimmed.length > 0 ? trimmed : null },
    });
  };

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
          addLabel={`Add ${scopeConfig.label}`}
          addIcon={<Plus className="w-4 h-4" />}
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
                isBusy={updateTrackerItem.isPending}
                onOpen={() => setSelectedItemId(item.id)}
                onToggleStatus={() => void handleToggleStatus(item)}
              />
            ))}
          </div>
        )}
      </div>

      <TrackerDetailsModal
        item={selectedItem}
        isSaving={updateTrackerItem.isPending}
        onClose={() => setSelectedItemId(null)}
        onToggleStatus={handleToggleStatus}
        onSaveNote={handleSaveNote}
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
    </AppLayout>
  );
}
