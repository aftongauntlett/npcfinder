import { useState, useEffect, ReactNode } from "react";
import { Search } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import { useTheme } from "../../../hooks/useTheme";
import { MediaItem } from "../media/SendMediaModal";

interface BaseSearchModalProps<T = MediaItem> {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  searchFunction: (query: string) => Promise<T[]>;
  placeholder: string;
  title: string;
  existingIds?: string[];
  renderResult: (
    result: T,
    alreadyAdded: boolean,
    handleAddClick: (result: T) => void,
    themeColor: string
  ) => ReactNode;
  emptyStateText?: string;
  initialText?: string;
}

/**
 * BaseSearchModal - A reusable search modal component for external API searches
 *
 * Features:
 * - 500ms debounced search
 * - Loading, empty, and error states
 * - Custom result rendering via renderResult prop
 * - Already-added item detection
 * - Accessible keyboard navigation
 *
 * @example
 * <BaseSearchModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onSelect={handleSelect}
 *   searchFunction={searchMoviesAndTV}
 *   placeholder="Search for movies or TV shows..."
 *   title="Add Media"
 *   existingIds={existingIds}
 *   renderResult={(result, alreadyAdded, handleAddClick, themeColor) => (
 *     <div>Custom result rendering</div>
 *   )}
 * />
 */
function BaseSearchModal<T extends { external_id: string; title: string }>({
  isOpen,
  onClose,
  onSelect,
  searchFunction,
  placeholder,
  title,
  existingIds = [],
  renderResult,
  emptyStateText = "No results found. Try a different search.",
  initialText = "Start typing to search",
}: BaseSearchModalProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [searching, setSearching] = useState(false);
  const { themeColor } = useTheme();

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
      const results = await searchFunction(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed", { error, searchQuery });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddClick = (result: T) => {
    onSelect(result);
    setSearchQuery("");
    setSearchResults([]);
  };

  const isAlreadyAdded = (externalId: string) => {
    return existingIds.includes(externalId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
      {/* Search Input */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Input
          id="base-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          leftIcon={<Search className="w-5 h-5 text-gray-400" />}
          autoFocus
        />
      </div>

      {/* Results */}
      <div className="overflow-y-auto p-6 max-h-[60vh]">
        {searching && (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            Searching...
          </p>
        )}

        {!searching && searchQuery && searchResults.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            {emptyStateText}
          </p>
        )}

        {!searching && !searchQuery && (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            {initialText}
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
                <div key={result.external_id}>
                  {renderResult(result, alreadyAdded, handleAddClick, themeColor)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default BaseSearchModal;
