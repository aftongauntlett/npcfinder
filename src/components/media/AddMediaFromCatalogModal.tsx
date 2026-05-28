import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button, Input, Modal, Select, Textarea } from "@/components/shared";
import type { MediaItem } from "@/components/shared";
import { logger } from "@/lib/logger";
import {
  searchMediaByScope,
  UNIFIED_SEARCH_CAP,
  type UnifiedSearchScope,
} from "@/services/unifiedMediaSearchService";
import Toast from "@/components/ui/Toast";

type ExistingKey = `${string}:${string}`;

type ResultFilter = "all" | "movies-tv" | "books" | "games" | "music";
type AddMode = "search" | "custom";
type CustomMediaType =
  | "movie"
  | "tv"
  | "book"
  | "game"
  | "song"
  | "album"
  | "playlist";

type CustomFormState = {
  title: string;
  subtitle: string;
  description: string;
  posterUrl: string;
  releaseDate: string;
  genres: string;
  authors: string;
  artist: string;
  album: string;
  platforms: string;
  isbn: string;
  pageCount: string;
  trackCount: string;
  playtime: string;
};

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const EMPTY_CUSTOM_FORM: CustomFormState = {
  title: "",
  subtitle: "",
  description: "",
  posterUrl: "",
  releaseDate: "",
  genres: "",
  authors: "",
  artist: "",
  album: "",
  platforms: "",
  isbn: "",
  pageCount: "",
  trackCount: "",
  playtime: "",
};

function mediaTypeLabel(mediaType: CustomMediaType): string {
  if (mediaType === "tv") return "TV";
  if (mediaType === "book") return "Book";
  if (mediaType === "game") return "Game";
  if (mediaType === "song") return "Song";
  if (mediaType === "album") return "Album";
  if (mediaType === "playlist") return "Playlist";
  return "Movie";
}

function allowedCustomTypesForScope(
  scope: UnifiedSearchScope,
): CustomMediaType[] {
  if (scope === "movies-tv") return ["movie", "tv"];
  if (scope === "books") return ["book"];
  if (scope === "games") return ["game"];
  if (scope === "music") return ["song", "album", "playlist"];
  return ["movie", "tv", "book", "game", "song", "album", "playlist"];
}

function toOptionalPositiveInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed);
}

function existingKey(
  item: Pick<MediaItem, "external_id" | "media_type">,
): ExistingKey {
  return `${String(item.media_type)}:${String(item.external_id)}`;
}

interface AddMediaFromCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  emptyHint?: string;
  addLabel?: string;
  searchScope?: UnifiedSearchScope;
  lockSearchScope?: boolean;
  searchPlaceholder?: string;
  existingItems?: Array<Pick<MediaItem, "external_id" | "media_type">>;
  onAdd: (item: MediaItem) => Promise<void>;
}

export default function AddMediaFromCatalogModal({
  isOpen,
  onClose,
  title = "Add Item",
  emptyHint = "Search to add items.",
  addLabel = "Add",
  searchScope = "all",
  lockSearchScope = false,
  searchPlaceholder = "Search movies, TV, books, games, music...",
  existingItems,
  onAdd,
}: AddMediaFromCatalogModalProps) {
  const [mode, setMode] = useState<AddMode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [resultFilter, setResultFilter] = useState<ResultFilter>(searchScope);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingId, setIsAddingId] = useState<string | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customMediaType, setCustomMediaType] =
    useState<CustomMediaType>("movie");
  const [customForm, setCustomForm] =
    useState<CustomFormState>(EMPTY_CUSTOM_FORM);
  const [totalBeforeCap, setTotalBeforeCap] = useState(0);
  const [wasCapped, setWasCapped] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const requestTokenRef = useRef(0);

  const customTypeOptions = useMemo(
    () =>
      allowedCustomTypesForScope(lockSearchScope ? searchScope : "all").map(
        (mediaType) => ({
          value: mediaType,
          label: mediaTypeLabel(mediaType),
        }),
      ),
    [lockSearchScope, searchScope],
  );

  useEffect(() => {
    if (isOpen) {
      setResultFilter(searchScope);
      setMode("search");
    }
  }, [isOpen, searchScope]);

  useEffect(() => {
    if (customTypeOptions.length === 0) {
      return;
    }

    setCustomMediaType((current) => {
      const isCurrentValid = customTypeOptions.some(
        (option) => option.value === current,
      );

      return isCurrentValid
        ? current
        : (customTypeOptions[0].value as CustomMediaType);
    });
  }, [customTypeOptions]);

  const existing = useMemo(() => {
    const set = new Set<ExistingKey>();
    for (const item of existingItems || []) {
      if (item.external_id && item.media_type) {
        set.add(existingKey(item));
      }
    }
    return set;
  }, [existingItems]);

  const runSearch = useCallback(
    async (rawQuery: string, requestToken = ++requestTokenRef.current) => {
      const trimmed = rawQuery.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) {
        if (requestToken === requestTokenRef.current) {
          setResults([]);
          setTotalBeforeCap(0);
          setWasCapped(false);
          setIsSearching(false);
        }
        return;
      }

      setIsSearching(true);
      try {
        const data = await searchMediaByScope(
          trimmed,
          lockSearchScope ? searchScope : "all",
        );
        if (requestToken !== requestTokenRef.current) {
          return;
        }
        setResults(data.results);
        setTotalBeforeCap(data.totalBeforeCap);
        setWasCapped(data.capped);
      } catch (error) {
        if (requestToken !== requestTokenRef.current) {
          return;
        }
        logger.error("Unified media search failed", { error, query: trimmed });
        setResults([]);
        setTotalBeforeCap(0);
        setWasCapped(false);
        setToast({ message: "Search failed" });
      } finally {
        if (requestToken === requestTokenRef.current) {
          setIsSearching(false);
        }
      }
    },
    [lockSearchScope, searchScope],
  );

  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    const requestToken = ++requestTokenRef.current;

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setTotalBeforeCap(0);
      setWasCapped(false);
      setIsSearching(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(trimmed, requestToken);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen, query, runSearch, lockSearchScope, searchScope]);

  const filteredResults = useMemo(() => {
    const activeFilter = lockSearchScope ? searchScope : resultFilter;

    if (activeFilter === "all") return results;

    if (activeFilter === "movies-tv") {
      return results.filter(
        (item) => item.media_type === "movie" || item.media_type === "tv",
      );
    }

    if (activeFilter === "books") {
      return results.filter((item) => item.media_type === "book");
    }

    if (activeFilter === "games") {
      return results.filter((item) => item.media_type === "game");
    }

    return results.filter(
      (item) =>
        item.media_type === "song" ||
        item.media_type === "album" ||
        item.media_type === "playlist",
    );
  }, [results, resultFilter, lockSearchScope, searchScope]);

  const handleAdd = async (item: MediaItem) => {
    const id = `${item.media_type}:${item.external_id}`;
    setIsAddingId(id);

    try {
      await onAdd(item);
      setToast({ message: "Added" });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        setToast({ message: "Already added" });
      } else {
        logger.error("Failed to add catalog media item", {
          error,
          externalId: item.external_id,
          mediaType: item.media_type,
        });
        setToast({ message: "Failed to add item" });
      }
    } finally {
      setIsAddingId(null);
    }
  };

  const handleAddCustom = async () => {
    const title = customForm.title.trim();
    if (!title) {
      setToast({ message: "Title is required" });
      return;
    }

    const customItem: MediaItem = {
      external_id: `custom:${crypto.randomUUID()}`,
      media_type: customMediaType,
      title,
      poster_url: customForm.posterUrl.trim() || null,
      release_date: customForm.releaseDate.trim() || null,
      description: customForm.description.trim() || null,
      is_user_created: true,
    };

    if (customForm.subtitle.trim()) {
      customItem.subtitle = customForm.subtitle.trim();
    }

    if (customForm.genres.trim()) {
      customItem.genres = customForm.genres.trim();
    }

    if (customMediaType === "book") {
      if (customForm.authors.trim()) {
        customItem.authors = customForm.authors.trim();
      }
      if (customForm.isbn.trim()) {
        customItem.isbn = customForm.isbn.trim();
      }
      const pageCount = toOptionalPositiveInt(customForm.pageCount);
      if (pageCount !== undefined) {
        customItem.page_count = pageCount;
      }
    }

    if (
      customMediaType === "song" ||
      customMediaType === "album" ||
      customMediaType === "playlist"
    ) {
      if (customForm.artist.trim()) {
        customItem.artist = customForm.artist.trim();
      }

      if (customForm.album.trim()) {
        customItem.album = customForm.album.trim();
      }

      const trackCount = toOptionalPositiveInt(customForm.trackCount);
      if (trackCount !== undefined) {
        customItem.track_count = trackCount;
      }
    }

    if (customMediaType === "game") {
      if (customForm.platforms.trim()) {
        customItem.platforms = customForm.platforms.trim();
      }

      const playtime = toOptionalPositiveInt(customForm.playtime);
      if (playtime !== undefined) {
        customItem.playtime = playtime;
      }
    }

    setIsAddingCustom(true);
    try {
      await onAdd(customItem);
      setToast({ message: "Custom item added" });
      setCustomForm(EMPTY_CUSTOM_FORM);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("Failed to add custom media item", {
        error,
        mediaType: customMediaType,
      });

      if (
        errorMessage.includes("is_user_created") ||
        errorMessage.includes("created_by_user_id")
      ) {
        setToast({
          message:
            "Custom entries need the latest DB migration (run npm run db:push).",
        });
      } else {
        setToast({ message: "Failed to add custom item" });
      }
    } finally {
      setIsAddingCustom(false);
    }
  };

  const updateCustomField = (field: keyof CustomFormState, value: string) => {
    setCustomForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleClose = () => {
    requestTokenRef.current += 1;
    onClose();
    setMode("search");
    setQuery("");
    setResults([]);
    setResultFilter(searchScope);
    setTotalBeforeCap(0);
    setWasCapped(false);
    setIsSearching(false);
    setIsAddingId(null);
    setIsAddingCustom(false);
    setCustomForm(EMPTY_CUSTOM_FORM);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="4xl">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant={mode === "search" ? "secondary" : "subtle"}
              onClick={() => setMode("search")}
              size="sm"
            >
              Search API
            </Button>
            <Button
              variant={mode === "custom" ? "secondary" : "subtle"}
              onClick={() => setMode("custom")}
              size="sm"
            >
              Add Custom Entry
            </Button>
          </div>

          {mode === "search" ? (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    leftIcon={<Search className="w-4 h-4" />}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const requestToken = ++requestTokenRef.current;
                        void runSearch(query, requestToken);
                      }
                    }}
                  />
                </div>
                <div className="pt-6">
                  <Button
                    onClick={() => {
                      const requestToken = ++requestTokenRef.current;
                      void runSearch(query, requestToken);
                    }}
                    disabled={
                      query.trim().length < MIN_QUERY_LENGTH || isSearching
                    }
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {results.length > 0 && !lockSearchScope && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: "all", label: "All" },
                      { id: "movies-tv", label: "Movies/TV" },
                      { id: "books", label: "Books" },
                      { id: "games", label: "Games" },
                      { id: "music", label: "Music" },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setResultFilter(chip.id as ResultFilter)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          resultFilter === chip.id
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {wasCapped && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Showing {results.length} of{" "}
                      {Math.max(totalBeforeCap, UNIFIED_SEARCH_CAP)} results -
                      try a more specific query for more options.
                    </div>
                  )}
                </div>
              )}

              {filteredResults.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isSearching
                    ? "Searching..."
                    : results.length > 0
                      ? "No results for this filter."
                      : emptyHint}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {filteredResults.map((item) => {
                    const id = `${item.media_type}:${item.external_id}`;
                    const alreadyAdded = existing.has(existingKey(item));
                    const isAdding = isAddingId === id;

                    return (
                      <div key={id} className="p-3 flex items-center gap-3">
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
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.media_type
                              ? String(item.media_type).toUpperCase()
                              : "UNKNOWN"}
                            {item.subtitle ? ` - ${item.subtitle}` : ""}
                          </div>
                        </div>

                        <Button
                          variant={alreadyAdded ? "subtle" : "secondary"}
                          disabled={alreadyAdded || isAdding}
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => void handleAdd(item)}
                        >
                          {alreadyAdded
                            ? "Added"
                            : isAdding
                              ? "Adding..."
                              : addLabel}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Only title is required. Add any optional fields you care about.
                Custom entries are marked as user-created and may be incomplete.
              </p>

              <Select
                id="custom-media-type"
                label="Media Type"
                value={customMediaType}
                onChange={(event) =>
                  setCustomMediaType(event.target.value as CustomMediaType)
                }
                options={customTypeOptions}
              />

              <Input
                id="custom-media-title"
                label="Title"
                value={customForm.title}
                onChange={(event) =>
                  updateCustomField("title", event.target.value)
                }
                placeholder="Required"
                required
              />

              <Input
                id="custom-media-image"
                label="Image URL"
                value={customForm.posterUrl}
                onChange={(event) =>
                  updateCustomField("posterUrl", event.target.value)
                }
                placeholder="https://..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="custom-media-release-date"
                  type="date"
                  label="Release Date"
                  value={customForm.releaseDate}
                  onChange={(event) =>
                    updateCustomField("releaseDate", event.target.value)
                  }
                />
                <Input
                  id="custom-media-subtitle"
                  label="Subtitle"
                  value={customForm.subtitle}
                  onChange={(event) =>
                    updateCustomField("subtitle", event.target.value)
                  }
                  placeholder="Optional"
                />
              </div>

              <Textarea
                id="custom-media-description"
                label="Description"
                value={customForm.description}
                onChange={(event) =>
                  updateCustomField("description", event.target.value)
                }
                rows={3}
                placeholder="Optional"
              />

              {(customMediaType === "movie" ||
                customMediaType === "tv" ||
                customMediaType === "game") && (
                <Input
                  id="custom-media-genres"
                  label="Genres"
                  value={customForm.genres}
                  onChange={(event) =>
                    updateCustomField("genres", event.target.value)
                  }
                  placeholder="e.g. Action, Thriller"
                />
              )}

              {customMediaType === "book" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="custom-media-authors"
                    label="Authors"
                    value={customForm.authors}
                    onChange={(event) =>
                      updateCustomField("authors", event.target.value)
                    }
                    placeholder="Optional"
                  />
                  <Input
                    id="custom-media-isbn"
                    label="ISBN"
                    value={customForm.isbn}
                    onChange={(event) =>
                      updateCustomField("isbn", event.target.value)
                    }
                    placeholder="Optional"
                  />
                  <Input
                    id="custom-media-page-count"
                    type="number"
                    label="Page Count"
                    value={customForm.pageCount}
                    onChange={(event) =>
                      updateCustomField("pageCount", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              )}

              {(customMediaType === "song" ||
                customMediaType === "album" ||
                customMediaType === "playlist") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="custom-media-artist"
                    label="Artist"
                    value={customForm.artist}
                    onChange={(event) =>
                      updateCustomField("artist", event.target.value)
                    }
                    placeholder="Optional"
                  />
                  <Input
                    id="custom-media-album"
                    label="Album"
                    value={customForm.album}
                    onChange={(event) =>
                      updateCustomField("album", event.target.value)
                    }
                    placeholder="Optional"
                  />
                  <Input
                    id="custom-media-track-count"
                    type="number"
                    label="Track Count"
                    value={customForm.trackCount}
                    onChange={(event) =>
                      updateCustomField("trackCount", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              )}

              {customMediaType === "game" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="custom-media-platforms"
                    label="Platforms"
                    value={customForm.platforms}
                    onChange={(event) =>
                      updateCustomField("platforms", event.target.value)
                    }
                    placeholder="e.g. PC, PS5"
                  />
                  <Input
                    id="custom-media-playtime"
                    type="number"
                    label="Playtime (hours)"
                    value={customForm.playtime}
                    onChange={(event) =>
                      updateCustomField("playtime", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="subtle"
                  onClick={() => setCustomForm(EMPTY_CUSTOM_FORM)}
                  disabled={isAddingCustom}
                >
                  Clear
                </Button>
                <Button
                  onClick={() => void handleAddCustom()}
                  disabled={!customForm.title.trim() || isAddingCustom}
                >
                  {isAddingCustom ? "Adding..." : "Add Custom Entry"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
}
