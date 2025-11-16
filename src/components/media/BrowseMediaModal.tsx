import { useState, useEffect } from "react";
import { X, Search, Plus, Loader } from "lucide-react";
import FocusTrap from "focus-trap-react";
import { UnifiedMediaCard, Button } from "@/components/shared";

interface BrowseMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: "music" | "books" | "games" | "movies";
  onAdd: (item: MediaItem) => Promise<void>;
  searchFunction: (query: string) => Promise<MediaItem[]>;
}

interface MediaItem {
  id: string;
  title: string;
  type?: string;
  year?: number;
  poster?: string;
  artist?: string;
  album?: string;
  author?: string;
  platforms?: string[];
  genres?: string[];
}

export function BrowseMediaModal({
  isOpen,
  onClose,
  mediaType,
  onAdd,
  searchFunction,
}: BrowseMediaModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await searchFunction(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (item: MediaItem) => {
    setAddingIds((prev) => new Set(prev).add(item.id));
    try {
      await onAdd(item);
      // Remove from results after successful add
      setSearchResults((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const getTitle = () => {
    switch (mediaType) {
      case "music":
        return "Browse Music";
      case "books":
        return "Browse Books";
      case "games":
        return "Browse Games";
      case "movies":
        return "Browse Movies & TV";
      default:
        return "Browse Media";
    }
  };

  const getPlaceholder = () => {
    switch (mediaType) {
      case "music":
        return "Search for songs, albums, or artists...";
      case "books":
        return "Search for books by title or author...";
      case "games":
        return "Search for games...";
      case "movies":
        return "Search for movies or TV shows...";
      default:
        return "Search...";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          escapeDeactivates: false, // We handle ESC manually
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: true,
        }}
      >
        <div className="w-full max-w-6xl my-8 max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getTitle()}
            </h2>
            <Button
              onClick={onClose}
              variant="subtle"
              size="icon"
              icon={<X size={24} />}
              aria-label="Close modal"
            />
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={(e) => void handleSearch(e)} className="flex gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                variant="primary"
                size="md"
                icon={
                  loading ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <Search size={20} />
                  )
                }
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </form>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="animate-spin text-primary" size={48} />
              </div>
            ) : searchResults.length > 0 ? (
              mediaType === "music" ? (
                // List view for music (Spotify-style)
                <div className="space-y-1">
                  {searchResults.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      {/* Track Number / Album Icon */}
                      <div className="w-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                        {index + 1}
                      </div>

                      {/* Album Art (small) */}
                      {item.poster && (
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}

                      {/* Title & Artist */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.artist || "Unknown Artist"}
                          {item.type === "album" && " • Album"}
                          {item.type === "track" &&
                            item.album &&
                            ` • ${item.album}`}
                        </div>
                      </div>

                      {/* Year */}
                      {item.year && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                          {item.year}
                        </div>
                      )}

                      {/* Add Button */}
                      <Button
                        onClick={() => void handleAdd(item)}
                        disabled={addingIds.has(item.id)}
                        variant="subtle"
                        size="icon"
                        icon={
                          addingIds.has(item.id) ? (
                            <Loader className="animate-spin" size={16} />
                          ) : (
                            <Plus size={20} />
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white opacity-0 group-hover:opacity-100"
                        aria-label={`Add ${item.title} to collection`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // Grid view for other media types
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((item) => (
                    <div key={item.id} className="relative group">
                      <UnifiedMediaCard
                        mediaType="movie"
                        id={item.id}
                        title={item.title}
                        year={item.year}
                        posterUrl={item.poster}
                        onClick={() => {}}
                      />
                      <Button
                        onClick={() => void handleAdd(item)}
                        disabled={addingIds.has(item.id)}
                        variant="subtle"
                        size="icon"
                        icon={
                          addingIds.has(item.id) ? (
                            <Loader className="animate-spin" size={16} />
                          ) : (
                            <Plus size={16} />
                          )
                        }
                        className="absolute top-2 left-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white shadow-lg opacity-0 group-hover:opacity-100"
                        aria-label={`Add ${item.title} to collection`}
                      />
                    </div>
                  ))}
                </div>
              )
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Search size={64} className="mb-4 opacity-50" />
                <p className="text-lg">No results found for "{searchQuery}"</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Search size={64} className="mb-4 opacity-50" />
                <p className="text-lg">
                  Start searching to discover new {mediaType}
                </p>
                <p className="text-sm mt-2">
                  Use the search bar above to find what you're looking for
                </p>
              </div>
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
