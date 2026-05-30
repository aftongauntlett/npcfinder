import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button, Input, Modal } from "@/components/shared";
import type { TrackerItem } from "@/services/trackerService";
import Toast from "@/components/ui/Toast";

interface AddTrackerMediaToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerItems: TrackerItem[];
  existingMediaIds: string[];
  onAdd: (mediaId: string) => Promise<void>;
  title?: string;
}

type MediaFilter = "all" | "movie" | "tv" | "book" | "game" | "music";

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

export default function AddTrackerMediaToPlaylistModal({
  isOpen,
  onClose,
  trackerItems,
  existingMediaIds,
  onAdd,
  title = "Add From Tracker",
}: AddTrackerMediaToPlaylistModalProps) {
  const [query, setQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [isAddingMediaId, setIsAddingMediaId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const existingSet = useMemo(
    () => new Set(existingMediaIds),
    [existingMediaIds],
  );

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

  const handleClose = () => {
    setQuery("");
    setMediaFilter("all");
    setIsAddingMediaId(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="4xl">
        <div className="p-6 space-y-4">
          <Input
            id="playlist-add-from-tracker-search"
            label="Search your tracker"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles already in your tracker..."
            leftIcon={<Search className="w-4 h-4" />}
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

          {filteredItems.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No tracker items found for this search/filter.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
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
                      {alreadyAdded ? "Added" : isAdding ? "Adding..." : "Add"}
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
