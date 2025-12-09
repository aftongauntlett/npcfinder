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
  filter: _filter,
  mediaTypeFilter,
  genreFilters: _genreFilters,
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
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {mediaTypeFilter === "tv" && "No TV shows found"}
          {mediaTypeFilter === "movie" && "No movies found"}
          {mediaTypeFilter === "all" && "No items found"}
        </p>
      </div>
    );
  }

  return null;
};

export default WatchlistEmptyState;
