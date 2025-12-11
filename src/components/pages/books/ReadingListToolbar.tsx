import React from "react";
import { MediaPageToolbar } from "@/components/shared";
import { getReadingListFilterSections } from "../../../data/readingListFilters";
import type { ReadingListSortType } from "../../../data/readingListFilters";

interface ReadingListToolbarProps {
  availableCategories: Set<string>;
  categoryFilters: string[];
  sortBy: ReadingListSortType;
  searchQuery: string;
  onCategoryChange: (categories: string[]) => void;
  onSortChange: (sort: ReadingListSortType) => void;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onCollapseAll?: () => void;
  hasExpandedItems?: boolean;
}

const ReadingListToolbar: React.FC<ReadingListToolbarProps> = ({
  availableCategories,
  categoryFilters,
  sortBy,
  searchQuery,
  onCategoryChange,
  onSortChange,
  onSearchChange,
  onAddClick,
  onCollapseAll,
  hasExpandedItems,
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
        }}
        searchConfig={{
          value: searchQuery,
          onChange: onSearchChange,
          placeholder: "Search Books...",
        }}
        onAddClick={onAddClick}
        onCollapseAll={onCollapseAll}
        hasExpandedItems={hasExpandedItems}
      />
    </div>
  );
};

export default ReadingListToolbar;
