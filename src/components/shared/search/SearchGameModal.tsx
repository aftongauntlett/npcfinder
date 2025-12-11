import React from "react";
import { Plus, Check, Gamepad2 } from "lucide-react";
import { searchGames } from "../../../utils/mediaSearchAdapters";
import { MediaItem } from "../media/SendMediaModal";
import BaseSearchModal from "./BaseSearchModal";
import { formatReleaseDate } from "../../../utils/dateFormatting";

interface SearchGameModalProps {
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  existingIds?: string[]; // External IDs already in game library
}

/**
 * SearchGameModal - Game search modal using BaseSearchModal
 * Wraps BaseSearchModal with game-specific rendering and search function
 */
const SearchGameModal: React.FC<SearchGameModalProps> = ({
  onClose,
  onSelect,
  existingIds = [],
}) => {
  const renderGameResult = (
    result: MediaItem,
    alreadyAdded: boolean,
    handleAddClick: (result: MediaItem) => void,
    themeColor: string
  ) => (
    <div
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

  return (
    <BaseSearchModal
      isOpen={true}
      onClose={onClose}
      onSelect={onSelect}
      searchFunction={searchGames}
      placeholder="Search for games by title..."
      title="Add Game"
      existingIds={existingIds}
      renderResult={renderGameResult}
      emptyStateText="No results found. Try a different search."
      initialText="Start typing to search for games"
    />
  );
};

export default SearchGameModal;
