import { useState, useEffect, ReactNode } from "react";
import { Search, ListPlus } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Tooltip from "../ui/Tooltip";
import { useTheme } from "../../../hooks/useTheme";
import { MediaItem } from "../media/SendMediaModal";

interface BaseSearchModalProps<T = MediaItem> {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: T) => void | Promise<void>;
  searchFunction: (query: string) => Promise<T[]>;
  placeholder: string;
  title: string;
  existingIds?: string[];
  renderResult: (
    result: T,
    alreadyAdded: boolean,
    isPending: boolean,
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
  const [selectMultiple, setSelectMultiple] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, T>>(new Map());
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());
  const { themeColor } = useTheme();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
      setSelectMultiple(false);
      setSelectedItems(new Map());
      setPendingItems(new Set());
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

  const handleAddClick = async (result: T) => {
    // If item already exists in the database, don't allow any action
    if (existingIds.includes(result.external_id)) {
      return;
    }

    // In select multiple mode, toggle selection (don't add to DB yet)
    if (selectMultiple) {
      setSelectedItems((prev) => {
        const newMap = new Map(prev);
        if (newMap.has(result.external_id)) {
          newMap.delete(result.external_id);
        } else {
          newMap.set(result.external_id, result);
        }
        return newMap;
      });
      return;
    }

    // Single add mode: add immediately and close modal
    setPendingItems(new Set([...pendingItems, result.external_id]));
    
    try {
      await onSelect(result);
      setSearchQuery("");
      setSearchResults([]);
      onClose();
    } catch (error) {
      console.error("Failed to add item", { error, result });
    } finally {
      setPendingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(result.external_id);
        return newSet;
      });
    }
  };

  const handleClose = async () => {
    // If in select multiple mode and items are selected, batch add them
    if (selectMultiple && selectedItems.size > 0) {
      const itemsToAdd = Array.from(selectedItems.values());
      
      // Add all selected items
      for (const item of itemsToAdd) {
        try {
          await onSelect(item);
        } catch (error) {
          console.error("Failed to add item", { error, item });
        }
      }
      
      // Clear selections after adding
      setSelectedItems(new Map());
    }
    
    // Close the modal
    onClose();
  };

  const handleSelectMultipleToggle = () => {
    // If turning off select multiple, clear any selections
    if (selectMultiple) {
      setSelectedItems(new Map());
    }
    setSelectMultiple(!selectMultiple);
  };

  const isAlreadyAdded = (externalId: string) => {
    return existingIds.includes(externalId) || selectedItems.has(externalId);
  };

  const isPending = (externalId: string) => {
    return pendingItems.has(externalId);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="2xl">
      {/* Search Input & Controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex-1">
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
          
          {/* Select Multiple Toggle */}
          <Tooltip
            content={
              selectedItems.size > 0
                ? `Select Multiple (${selectedItems.size} selected)`
                : "Select Multiple"
            }
            position="bottom"
          >
            <button
              onClick={handleSelectMultipleToggle}
              className={`p-2 rounded-lg transition-all ${
                selectMultiple
                  ? ""
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <ListPlus
                className="h-10 w-10 transition-colors"
                style={{
                  color: selectMultiple ? themeColor : undefined,
                  stroke: selectMultiple ? themeColor : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!selectMultiple) {
                    e.currentTarget.style.stroke = themeColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectMultiple) {
                    e.currentTarget.style.stroke = '';
                  }
                }}
              />
            </button>
          </Tooltip>
        </div>
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
              const pending = isPending(result.external_id);
              return (
                <div key={result.external_id}>
                  {renderResult(result, alreadyAdded, pending, handleAddClick, themeColor)}
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
