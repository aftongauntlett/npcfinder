import React from "react";
import { Plus, Check, Film, Tv } from "lucide-react";
import { searchMoviesAndTV } from "../../../utils/mediaSearchAdapters";
import { MediaItem } from "../media/SendMediaModal";
import BaseSearchModal from "./BaseSearchModal";
import { formatReleaseDate } from "../../../utils/dateFormatting";

interface SearchMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: MediaItem) => void;
  existingIds?: string[]; // External IDs already in watch list
}

/**
 * SearchMovieModal - Movie/TV search modal using BaseSearchModal
 * Wraps BaseSearchModal with movie-specific rendering and search function
 */
const SearchMovieModal: React.FC<SearchMovieModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingIds = [],
}) => {
  const renderMovieResult = (
    result: MediaItem,
    alreadyAdded: boolean,
    handleAddClick: (result: MediaItem) => void,
    themeColor: string
  ) => {
    const resultMediaType = result.media_type || "movie";

    return (
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
            : `Add ${result.title} to watchlist`
        }
      >
        {/* Poster */}
        <div className="flex-shrink-0">
          {result.poster_url ? (
            <img
              src={result.poster_url}
              alt={result.title}
              className="w-16 h-24 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-24 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
              {resultMediaType === "tv" ? (
                <Tv className="w-8 h-8 text-gray-400" />
              ) : (
                <Film className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {result.title}
          </h3>
          <div className="flex flex-col gap-1 mt-1">
            {result.release_date && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatReleaseDate(result.release_date)}
              </p>
            )}
            {/* Media Type Chip */}
            <span
              className={`inline-flex items-center self-start px-2 py-0.5 text-xs font-medium rounded ${
                resultMediaType === "tv"
                  ? "bg-primary/10 text-primary"
                  : "bg-blue-100/80 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200"
              }`}
            >
              {resultMediaType === "tv" ? "TV Show" : "Movie"}
            </span>
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
  };

  return (
    <BaseSearchModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onAdd}
      searchFunction={searchMoviesAndTV}
      placeholder="Search for movies or TV shows..."
      title="Add Media"
      existingIds={existingIds}
      renderResult={renderMovieResult}
      emptyStateText="No results found. Try a different search."
      initialText="Start typing to search for movies and TV shows"
    />
  );
};

export default SearchMovieModal;
