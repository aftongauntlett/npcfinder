export const READING_LIST_PERSISTENCE_KEY = "readingList";

export type ReadingListSortType = "custom" | "date-added" | "title" | "year" | "rating";

export interface ReadingListFilters {
  categoryFilters: string[];
  sortBy: ReadingListSortType;
  [key: string]: string | string[] | number | boolean; // Index signature for persistence compatibility
}

export const READING_LIST_DEFAULT_FILTERS: ReadingListFilters = {
  categoryFilters: ["all"],
  sortBy: "custom",
};

export function getReadingListFilterSections(availableCategories: Set<string>) {
  const sortedCategories = Array.from(availableCategories).sort();

  const categoryOptions = [
    { id: "all", label: "All Categories" },
    ...sortedCategories.map((category) => ({
      id: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
    })),
  ];

  return [
    {
      id: "category",
      title: "Category",
      multiSelect: true,
      options: categoryOptions,
    },
    {
      id: "sort",
      title: "Sort By",
      options: [
        { id: "custom", label: "Custom" },
        { id: "date-added", label: "Recently Added" },
        { id: "title", label: "Title" },
        { id: "year", label: "Publication Year" },
        { id: "rating", label: "Your Rating" },
      ],
    },
  ];
}
