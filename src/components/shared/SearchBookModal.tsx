import React, { useState, useEffect } from "react";
import { Search, Plus, Check, BookOpen } from "lucide-react";
import { searchBooks } from "../../utils/bookSearchAdapters";
import { MediaItem } from "./SendMediaModal";
import Modal from "./Modal";
import { useTheme } from "../../hooks/useTheme";
import { formatReleaseDate } from "../../utils/dateFormatting";

interface SearchBookModalProps {
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  existingIds?: string[]; // External IDs already in reading list
}

const SearchBookModal: React.FC<SearchBookModalProps> = ({
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
      const results = await searchBooks(searchQuery);
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
    <Modal isOpen={true} onClose={onClose} title="Add Book" maxWidth="2xl">
      {/* Search Input */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for books by title, author, or ISBN..."
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
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!searching && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No books found. Try a different search term.
          </div>
        )}

        {!searching && searchResults.length === 0 && !searchQuery && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Search for books by title, author, or ISBN</p>
          </div>
        )}

        <div className="space-y-3">
          {searchResults.map((result) => {
            const alreadyAdded = isAlreadyAdded(result.external_id);

            return (
              <div
                key={result.external_id}
                className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Book Cover */}
                {result.poster_url && (
                  <img
                    src={result.poster_url}
                    alt={`${result.title} cover`}
                    className="w-16 h-24 object-cover rounded flex-shrink-0"
                  />
                )}

                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                    {result.title}
                  </h4>
                  {result.author && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {result.author}
                    </p>
                  )}
                  {result.release_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatReleaseDate(result.release_date)}
                    </p>
                  )}
                  {result.page_count && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {result.page_count} pages
                    </p>
                  )}
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleAddClick(result)}
                  disabled={alreadyAdded}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                    alreadyAdded
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                  style={
                    !alreadyAdded
                      ? ({ backgroundColor: themeColor } as React.CSSProperties)
                      : undefined
                  }
                >
                  {alreadyAdded ? (
                    <>
                      <Check className="w-4 h-4 inline mr-1" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default SearchBookModal;
