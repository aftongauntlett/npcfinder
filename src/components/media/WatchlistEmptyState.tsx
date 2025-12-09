import React from "react";
import { Film } from "lucide-react";
import { EmptyStateAddCard } from "@/components/shared";
import type { MediaTypeFilter } from "../../data/watchlistFilters";

interface WatchlistEmptyStateProps {
  filter: "all" | "to-watch" | "watched";
  mediaTypeFilter: MediaTypeFilter;
  genreFilters: string[];
  hasItemsForCurrentFilter: boolean;
  totalItems: number;
  onAddClick: () => void;
}

const WatchlistEmptyState: React.FC<WatchlistEmptyStateProps> = ({
  filter,
  mediaTypeFilter,
  genreFilters,
  hasItemsForCurrentFilter,
  totalItems,
  onAddClick,
}) => {
  // Show generic empty state when there are no items for the current filter
  if (!hasItemsForCurrentFilter) {
    return (
      <EmptyStateAddCard
        icon={Film}
        title="Your Movie & TV list is empty"
        description="You haven't added any movies or TV shows to your list yet. Add content to start tracking what you're currently watching!"
        onClick={onAddClick}
        ariaLabel="Add movies or TV shows to your watchlist"
      />
    );
  }

  // Show message when filters yield no results
  if (totalItems === 0) {
    const hasActiveFilters =
      mediaTypeFilter !== "all" ||
      (genreFilters.length > 0 && !genreFilters.includes("all"));

    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
          {hasActiveFilters
            ? "No movies match your filters"
            : filter === "to-watch"
            ? "No movies in your watching list"
            : filter === "watched"
            ? "No movies in your watched list"
            : "No items found"}
        </p>
        {hasActiveFilters && (
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Try adjusting your media type or genre filters
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default WatchlistEmptyState;
