import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button, Input, Modal } from "@/components/shared";
import type { MediaItem } from "@/components/shared";
import { logger } from "@/lib/logger";
import type { CatalogMedia } from "@/services/mediaCatalogService";
import {
  searchMediaByScope,
  type UnifiedSearchScope,
} from "@/services/unifiedMediaSearchService";
import type { TrackerItem } from "@/services/trackerService";
import Toast from "@/components/ui/Toast";

interface AddTrackerMediaToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerItems: TrackerItem[];
  existingMediaIds: string[];
  onAdd: (mediaId: string) => Promise<void>;
  existingMediaItems?: Array<Pick<CatalogMedia, "external_id" | "media_type">>;
  onAddExternal?: (item: MediaItem) => Promise<void>;
  title?: string;
}

type MediaFilter = "all" | "movie" | "tv" | "book" | "game" | "music";
type MediaKey = `${string}:${string}`;

const SEARCH_DEBOUNCE_MS = 400;
const MIN_EXTERNAL_QUERY_LENGTH = 2;

const FILTER_OPTIONS: Array<{ id: MediaFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV" },
  { id: "book", label: "Books" },
  { id: "game", label: "Games" },
  { id: "music", label: "Music" },
];

function matchesMediaFilter(
  mediaType: string | null | undefined,
  filter: MediaFilter,
): boolean {
  if (filter === "all") return true;

  const normalized = (mediaType || "").toLowerCase();

  if (filter === "music") {
    return (
      normalized === "song" ||
      normalized === "album" ||
      normalized === "playlist" ||
      normalized === "music"
    );
  }

  return normalized === filter;
}

function mediaKey(
  item:
    | Pick<MediaItem, "external_id" | "media_type">
    | Pick<CatalogMedia, "external_id" | "media_type">,
): MediaKey | null {
  if (!item.external_id || !item.media_type) return null;
  return `${String(item.media_type)}:${String(item.external_id)}`;
}

function searchScopeForFilter(filter: MediaFilter): UnifiedSearchScope {
  if (filter === "movie" || filter === "tv") return "movies-tv";
  if (filter === "book") return "books";
  if (filter === "game") return "games";
  if (filter === "music") return "music";
  return "all";
}

export default function AddTrackerMediaToPlaylistModal({
  isOpen,
  onClose,
  trackerItems,
  existingMediaIds,
  onAdd,
  existingMediaItems = [],
  onAddExternal,
  title = "Add From Tracker",
}: AddTrackerMediaToPlaylistModalProps) {
  const [query, setQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [isAddingMediaId, setIsAddingMediaId] = useState<string | null>(null);
  const [isAddingExternalId, setIsAddingExternalId] = useState<string | null>(
    null,
  );
  const [externalResults, setExternalResults] = useState<MediaItem[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const requestTokenRef = useRef(0);

  const existingSet = useMemo(
    () => new Set(existingMediaIds),
    [existingMediaIds],
  );

  const existingExternalKeys = useMemo(() => {
    const set = new Set<MediaKey>();
    for (const item of existingMediaItems) {
      const key = mediaKey(item);
      if (key) set.add(key);
    }
    return set;
  }, [existingMediaItems]);

  const trackedExternalKeys = useMemo(() => {
    const set = new Set<MediaKey>();
    for (const item of trackerItems) {
      if (!item.media) continue;
      const key = mediaKey(item.media);
      if (key) set.add(key);
    }
    return set;
  }, [trackerItems]);

  const sortedItems = useMemo(
    () =>
      [...trackerItems].sort((a, b) =>
        (b.updated_at || "").localeCompare(a.updated_at || ""),
      ),
    [trackerItems],
  );

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sortedItems.filter((item) => {
      if (!matchesMediaFilter(item.media?.media_type, mediaFilter)) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        item.media?.title || "",
        item.media?.subtitle || "",
        item.media?.description || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [mediaFilter, query, sortedItems]);

  const filterCounts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const counts: Record<MediaFilter, number> = {
      all: 0,
      movie: 0,
      tv: 0,
      book: 0,
      game: 0,
      music: 0,
    };

    for (const item of sortedItems) {
      const haystack = [
        item.media?.title || "",
        item.media?.subtitle || "",
        item.media?.description || "",
      ]
        .join(" ")
        .toLowerCase();

      if (search && !haystack.includes(search)) {
        continue;
      }

      counts.all += 1;

      if (matchesMediaFilter(item.media?.media_type, "movie"))
        counts.movie += 1;
      if (matchesMediaFilter(item.media?.media_type, "tv")) counts.tv += 1;
      if (matchesMediaFilter(item.media?.media_type, "book")) counts.book += 1;
      if (matchesMediaFilter(item.media?.media_type, "game")) counts.game += 1;
      if (matchesMediaFilter(item.media?.media_type, "music")) {
        counts.music += 1;
      }
    }

    return counts;
  }, [query, sortedItems]);

  const runExternalSearch = useCallback(
    async (rawQuery: string, requestToken = ++requestTokenRef.current) => {
      const trimmed = rawQuery.trim();

      if (!onAddExternal || trimmed.length < MIN_EXTERNAL_QUERY_LENGTH) {
        if (requestToken === requestTokenRef.current) {
          setExternalResults([]);
          setIsSearchingExternal(false);
        }
        return;
      }

      setIsSearchingExternal(true);
      try {
        const data = await searchMediaByScope(
          trimmed,
          searchScopeForFilter(mediaFilter),
        );
        if (requestToken !== requestTokenRef.current) return;
        setExternalResults(data.results);
      } catch (error) {
        if (requestToken !== requestTokenRef.current) return;
        logger.error("Playlist media search failed", { error, query: trimmed });
        setExternalResults([]);
        setToast({ message: "Search failed" });
      } finally {
        if (requestToken === requestTokenRef.current) {
          setIsSearchingExternal(false);
        }
      }
    },
    [mediaFilter, onAddExternal],
  );

  useEffect(() => {
    if (!isOpen || !onAddExternal) return;

    const trimmed = query.trim();
    const requestToken = ++requestTokenRef.current;

    if (trimmed.length < MIN_EXTERNAL_QUERY_LENGTH) {
      setExternalResults([]);
      setIsSearchingExternal(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runExternalSearch(trimmed, requestToken);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen, onAddExternal, query, runExternalSearch]);

  const visibleExternalResults = useMemo(
    () =>
      externalResults.filter((item) => {
        if (!matchesMediaFilter(item.media_type, mediaFilter)) {
          return false;
        }

        const key = mediaKey(item);
        return Boolean(key && !trackedExternalKeys.has(key));
      }),
    [externalResults, mediaFilter, trackedExternalKeys],
  );

  const handleAdd = async (mediaId: string) => {
    setIsAddingMediaId(mediaId);
    try {
      await onAdd(mediaId);
      setToast({ message: "Added" });
    } catch {
      setToast({ message: "Failed to add" });
    } finally {
      setIsAddingMediaId(null);
    }
  };

  const handleAddExternal = async (item: MediaItem) => {
    if (!onAddExternal) return;

    const key = mediaKey(item);
    if (!key) {
      setToast({ message: "Unable to add this item" });
      return;
    }

    setIsAddingExternalId(key);
    try {
      await onAddExternal(item);
      setToast({ message: "Added" });
    } catch {
      setToast({ message: "Failed to add" });
    } finally {
      setIsAddingExternalId(null);
    }
  };

  const handleClose = () => {
    requestTokenRef.current += 1;
    setQuery("");
    setMediaFilter("all");
    setIsAddingMediaId(null);
    setIsAddingExternalId(null);
    setExternalResults([]);
    setIsSearchingExternal(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="4xl">
        <div className="p-6 space-y-4">
          <Input
            id="playlist-add-from-tracker-search"
            label="Search media"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles to add..."
            leftIcon={<Search className="w-4 h-4" />}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const requestToken = ++requestTokenRef.current;
                void runExternalSearch(query, requestToken);
              }
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = mediaFilter === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMediaFilter(option.id)}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary dark:border-primary-light dark:bg-primary-light/15 dark:text-primary-light"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="ml-1.5 rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] leading-none">
                    {filterCounts[option.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  In your tracker
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[34vh] overflow-y-auto">
                  {filteredItems.map((item) => {
                    const mediaId = item.media_id;
                    const alreadyAdded = existingSet.has(mediaId);
                    const isAdding = isAddingMediaId === mediaId;

                    return (
                      <div key={item.id} className="p-3 flex items-center gap-3">
                        {item.media?.poster_url ? (
                          <img
                            src={item.media.poster_url}
                            alt=""
                            className="w-10 h-14 object-cover rounded border border-gray-200 dark:border-gray-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-14 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {item.media?.title || "Untitled"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {(item.media?.media_type || "unknown").toUpperCase()}
                          </div>
                        </div>

                        <Button
                          variant={alreadyAdded ? "subtle" : "secondary"}
                          disabled={alreadyAdded || isAdding}
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => void handleAdd(mediaId)}
                        >
                          {alreadyAdded
                            ? "Added"
                            : isAdding
                              ? "Adding..."
                              : "Add"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {query.trim().length >= MIN_EXTERNAL_QUERY_LENGTH &&
              onAddExternal && (
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    More results
                  </div>
                  {visibleExternalResults.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isSearchingExternal
                        ? "Searching..."
                        : filteredItems.length === 0
                          ? "No results found."
                          : "No more matches found."}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[34vh] overflow-y-auto">
                      {visibleExternalResults.map((item) => {
                        const key = mediaKey(item);
                        const alreadyAdded = Boolean(
                          key && existingExternalKeys.has(key),
                        );
                        const isAdding = isAddingExternalId === key;

                        return (
                          <div
                            key={key ?? `${item.media_type}:${item.title}`}
                            className="p-3 flex items-center gap-3"
                          >
                            {item.poster_url ? (
                              <img
                                src={item.poster_url}
                                alt=""
                                className="w-10 h-14 object-cover rounded border border-gray-200 dark:border-gray-700"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-10 h-14 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {item.title || "Untitled"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {(item.media_type || "unknown").toUpperCase()}
                                {item.subtitle ? ` - ${item.subtitle}` : ""}
                              </div>
                            </div>

                            <Button
                              variant={alreadyAdded ? "subtle" : "secondary"}
                              disabled={alreadyAdded || isAdding}
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => void handleAddExternal(item)}
                            >
                              {alreadyAdded
                                ? "Added"
                                : isAdding
                                  ? "Adding..."
                                  : "Add"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {filteredItems.length === 0 &&
              query.trim().length < MIN_EXTERNAL_QUERY_LENGTH && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Start typing to find something to add.
                </div>
              )}
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
}
