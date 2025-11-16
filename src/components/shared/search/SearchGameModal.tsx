import React, { useState, useEffect } from "react";
import { Search, Plus, Check, Gamepad2 } from "lucide-react";
import { searchGames } from "../../../utils/mediaSearchAdapters";
import { MediaItem } from "../media/SendMediaModal";
import Modal from "../ui/Modal";
import { useTheme } from "../../../hooks/useTheme";
import { formatReleaseDate } from "../../../utils/dateFormatting";

interface SearchGameModalProps {
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  existingIds?: string[]; // External IDs already in game library
}

const SearchGameModal: React.FC<SearchGameModalProps> = ({
  onClose,
  onSelect,
  existingIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const { themeColor } = useTheme();

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      void handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchGames(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddClick = (result: MediaItem) => {
    onSelect(result);
    setSearchQuery("");
    setSearchResults([]);
  };

  const isAlreadyAdded = (externalId: string) => {
    return existingIds.includes(externalId);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Game" maxWidth="2xl">
      {/* Search Input */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for games by title..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent"
            style={
              {
                "--tw-ring-color": themeColor,
              } as React.CSSProperties
            }
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto p-6 max-h-[60vh]">
        {searching && (
          <p className="text-center text-gray-500 py-8">Searching...</p>
        )}

        {!searching && searchQuery && searchResults.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No results found. Try a different search.
          </p>
        )}

        {!searching && !searchQuery && (
          <p className="text-center text-gray-500 py-8">
            Start typing to search for games
          </p>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Found {searchResults.length} results
            </p>
            {searchResults.map((result) => {
              const alreadyAdded = isAlreadyAdded(result.external_id);

              return (
                <div
                  key={result.external_id}
                  onClick={() => !alreadyAdded && handleAddClick(result)}
                  className={`group relative flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all ${
                    alreadyAdded
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md"
                  }`}
                  role="button"
                  tabIndex={alreadyAdded ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!alreadyAdded && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleAddClick(result);
                    }
                  }}
                  aria-label={
                    alreadyAdded
                      ? `${result.title} - Already added`
                      : `Add ${result.title} to game library`
                  }
                >
                  {/* Game Cover */}
                  <div className="flex-shrink-0">
                    {result.poster_url ? (
                      <img
                        src={result.poster_url}
                        alt={result.title}
                        className="w-24 h-16 rounded object-cover"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1">
                      {result.platforms && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.platforms}
                        </p>
                      )}
                      {result.release_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Released: {formatReleaseDate(result.release_date)}
                        </p>
                      )}
                      {result.genres && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {result.genres}
                        </p>
                      )}
                      {result.rating && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Rating: {result.rating.toFixed(1)}/5.0
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add Icon - Shows on hover or when already added */}
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
                    {alreadyAdded ? (
                      <Check
                        className="w-5 h-5 text-gray-600 dark:text-gray-300"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: themeColor }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SearchGameModal;
