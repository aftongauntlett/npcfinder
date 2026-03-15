import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button, Input, Modal } from "@/components/shared";
import type { MediaItem } from "@/components/shared";
import { logger } from "@/lib/logger";
import { searchAllMedia } from "@/services/unifiedMediaSearchService";
import { useAddCollectionItem } from "@/hooks/useCollectionsQueries";
import type { MediaDomain } from "@/services/collectionsServiceTypes";
import Toast from "@/components/ui/Toast";

type ExistingKey = `${string}:${string}`; // `${media_type}:${external_id}`

function existingKey(
  item: Pick<MediaItem, "external_id" | "media_type">,
): ExistingKey {
  return `${String(item.media_type)}:${String(item.external_id)}`;
}

export default function AddItemToCollectionModal(props: {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  mediaDomain: MediaDomain;
  existingItems?: Array<Pick<MediaItem, "external_id" | "media_type">>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const addItem = useAddCollectionItem(props.mediaDomain);

  const existing = useMemo(() => {
    const set = new Set<ExistingKey>();
    for (const i of props.existingItems || []) {
      if (i.external_id && i.media_type) set.add(existingKey(i));
    }
    return set;
  }, [props.existingItems]);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchAllMedia(q);
      setResults(data);
    } catch (error) {
      logger.error("Unified media search failed", { error, query: q });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (item: MediaItem) => {
    try {
      await addItem.mutateAsync({ collectionId: props.collectionId, item });
      setToast({ message: "Added to collection" });
    } catch (error) {
      // Duplicate (unique constraint) => show toast, treat as non-fatal.
      if ((error as unknown as { code?: string }).code === "23505") {
        setToast({ message: "Already in this collection" });
        return;
      }

      logger.error("Failed to add item to collection", {
        error,
        collectionId: props.collectionId,
        externalId: item.external_id,
        mediaType: item.media_type,
      });
      setToast({ message: "Failed to add item" });
    }
  };

  const onClose = () => {
    props.onClose();
    setQuery("");
    setResults([]);
    setIsSearching(false);
  };

  return (
    <>
      <Modal
        isOpen={props.isOpen}
        onClose={onClose}
        title="Add Item"
        maxWidth="4xl"
      >
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, TV, books, games, music..."
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

          {results.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isSearching
                ? "Searching..."
                : "Search to add items to this collection."}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {results.map((item) => {
                const key = existingKey(item);
                const alreadyAdded = existing.has(key);

                return (
                  <div
                    key={`${item.media_type}:${item.external_id}`}
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
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.media_type
                          ? String(item.media_type).toUpperCase()
                          : "UNKNOWN"}
                        {item.subtitle ? ` • ${item.subtitle}` : ""}
                      </div>
                    </div>

                    <Button
                      variant={alreadyAdded ? "subtle" : "secondary"}
                      disabled={alreadyAdded}
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => void handleAdd(item)}
                    >
                      {alreadyAdded ? "Added" : "Add"}
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
