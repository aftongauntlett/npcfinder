import React, { useState, useEffect } from "react";
import { Search, Plus, Check, Film, Tv } from "lucide-react";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import { MediaItem } from "./SendMediaModal";
import Button from "./Button";
import Modal from "./Modal";

interface SearchMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: MediaItem) => void;
  existingIds?: string[]; // External IDs already in watch list
}

const SearchMovieModal: React.FC<SearchMovieModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
    }
  }, [isOpen]);

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
      const results = await searchMoviesAndTV(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddClick = (result: MediaItem) => {
    onAdd(result);
    setSearchQuery("");
    setSearchResults([]);
  };

  const isAlreadyAdded = (externalId: string) => {
    return existingIds.includes(externalId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Movie or TV Show"
      maxWidth="2xl"
    >
      {/* Search Input */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for movies or TV shows..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent"
            style={
              {
                "--tw-ring-color": "var(--color-primary)",
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
            Start typing to search for movies and TV shows
          </p>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Found {searchResults.length} results
            </p>
            {searchResults.map((result) => {
              const alreadyAdded = isAlreadyAdded(result.external_id);
              const resultMediaType = result.media_type || "movie";

              return (
                <div
                  key={result.external_id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Poster */}
                  {result.poster_url ? (
                    <img
                      src={result.poster_url}
                      alt={result.title}
                      className="w-16 h-24 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                      {resultMediaType === "tv" ? (
                        <Tv className="w-8 h-8 text-gray-400" />
                      ) : (
                        <Film className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.subtitle}
                      {result.release_date && ` • ${result.release_date}`}
                    </p>
                    {result.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>

                  {/* Add Button */}
                  <Button
                    onClick={() => handleAddClick(result)}
                    disabled={alreadyAdded}
                    variant={alreadyAdded ? "secondary" : "primary"}
                    size="sm"
                    icon={
                      alreadyAdded ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )
                    }
                  >
                    {alreadyAdded ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 justify-end p-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onClose}
          variant="secondary"
          className="!border-red-600 !text-red-600 hover:!bg-red-600 hover:!text-white"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default SearchMovieModal;
