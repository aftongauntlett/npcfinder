import React from "react";
import { BookOpen } from "lucide-react";
import { EmptyStateAddCard } from "@/components/shared";

interface ReadingListEmptyStateProps {
  filter: "all" | "to-read" | "read";
  hasItemsForCurrentFilter: boolean;
  totalItems: number;
  categoryFilters: string[];
  onAddClick: () => void;
}

const ReadingListEmptyState: React.FC<ReadingListEmptyStateProps> = ({
  filter: _filter,
  hasItemsForCurrentFilter,
  totalItems,
  categoryFilters,
  onAddClick,
}) => {
  // Show generic empty state when there are no items for the current filter
  if (!hasItemsForCurrentFilter) {
    return (
      <EmptyStateAddCard
        icon={BookOpen}
        title="Your Reading list is empty"
        description="You haven't added any books to your list yet. Add books to start tracking what you're currently reading!"
        onClick={onAddClick}
        ariaLabel="Add books to your reading list"
      />
    );
  }

  // Show message when filters yield no results
  if (totalItems === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No books found in selected{" "}
          {categoryFilters.length === 1 && categoryFilters[0] !== "all"
            ? categoryFilters[0]
            : ""}{" "}
          {categoryFilters.length > 1
            ? `categories (${categoryFilters.join(", ")})`
            : "categories"}
        </p>
      </div>
    );
  }

  return null;
};

export default ReadingListEmptyState;
