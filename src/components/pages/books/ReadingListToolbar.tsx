import React from "react";
import { MediaPageToolbar } from "@/components/shared";
import { getReadingListFilterSections } from "../../../data/readingListFilters";
import type { ReadingListSortType } from "../../../data/readingListFilters";

interface ReadingListToolbarProps {
  availableCategories: Set<string>;
  categoryFilters: string[];
  sortBy: ReadingListSortType;
  onCategoryChange: (categories: string[]) => void;
  onSortChange: (sort: ReadingListSortType) => void;
  onResetFilters: () => void;
  onAddClick: () => void;
}

const ReadingListToolbar: React.FC<ReadingListToolbarProps> = ({
  availableCategories,
  categoryFilters,
  sortBy,
  onCategoryChange,
  onSortChange,
  onResetFilters,
  onAddClick,
}) => {
  const filterSections = getReadingListFilterSections(availableCategories);

  return (
    <div className="space-y-3 mb-6">
      <MediaPageToolbar
        filterConfig={{
          type: "menu",
          sections: filterSections,
          activeFilters: {
            category: categoryFilters,
            sort: sortBy,
          },
          onFilterChange: (sectionId, value) => {
            if (sectionId === "category") {
              const categories = Array.isArray(value) ? value : [value];
              onCategoryChange(categories);
            } else if (sectionId === "sort") {
              onSortChange(value as ReadingListSortType);
            }
          },
          onResetFilters,
          hasActiveFilters:
            !categoryFilters.includes("all") && categoryFilters.length > 0,
        }}
        onAddClick={onAddClick}
      />
    </div>
  );
};

export default ReadingListToolbar;
