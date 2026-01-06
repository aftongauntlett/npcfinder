import React from "react";
import { BookOpen } from "lucide-react";
import { EmptyStateAddCard } from "@/components/shared";

interface ReadingListEmptyStateProps {
  hasItemsForCurrentFilter: boolean;
  totalItems: number;
  categoryFilters: string[];
  onAddClick: () => void;
}

const ReadingListEmptyState: React.FC<ReadingListEmptyStateProps> = ({
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
        title="Your Book library is empty"
        description="You haven't added any books yet. Add something to start building your library."
        onClick={onAddClick}
        ariaLabel="Add books to your library"
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
