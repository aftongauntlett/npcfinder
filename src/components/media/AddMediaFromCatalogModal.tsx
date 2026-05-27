import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button, Input, Modal } from "@/components/shared";
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [resultFilter, setResultFilter] = useState<ResultFilter>(searchScope);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingId, setIsAddingId] = useState<string | null>(null);
  const [totalBeforeCap, setTotalBeforeCap] = useState(0);
  const [wasCapped, setWasCapped] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResultFilter(searchScope);
    }
  }, [isOpen, searchScope]);

  const existing = useMemo(() => {
    const set = new Set<ExistingKey>();
    for (const item of existingItems || []) {
      if (item.external_id && item.media_type) {
        set.add(existingKey(item));
      }
    }
    return set;
  }, [existingItems]);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchMediaByScope(
        trimmed,
        lockSearchScope ? searchScope : "all",
      );
      setResults(data.results);
      setTotalBeforeCap(data.totalBeforeCap);
      setWasCapped(data.capped);
    } catch (error) {
      logger.error("Unified media search failed", { error, query: trimmed });
      setResults([]);
      setTotalBeforeCap(0);
      setWasCapped(false);
      setToast({ message: "Search failed" });
    } finally {
      setIsSearching(false);
    }
  };

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

  const handleClose = () => {
    onClose();
    setQuery("");
    setResults([]);
    setResultFilter(searchScope);
    setTotalBeforeCap(0);
    setWasCapped(false);
    setIsSearching(false);
    setIsAddingId(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="4xl">
        <div className="p-6 space-y-4">
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
                    void runSearch();
                  }
                }}
              />
            </div>
            <div className="pt-6">
              <Button
                onClick={() => void runSearch()}
                disabled={!query.trim() || isSearching}
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
                  {Math.max(totalBeforeCap, UNIFIED_SEARCH_CAP)} results - try a
                  more specific query for more options.
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
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
}
