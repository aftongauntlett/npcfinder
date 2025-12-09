import type { SortOption } from "@/components/shared";

export const WATCHLIST_PERSISTENCE_KEY = "watchlist";

export type MediaTypeFilter = "all" | "movie" | "tv";
export type WatchlistSortType = "date-added" | "title" | "year" | "rating";

export interface WatchlistFilters {
  mediaTypeFilter: MediaTypeFilter;
  genreFilters: string[];
  sortBy: WatchlistSortType;
  [key: string]: string | string[] | number | boolean; // Index signature for persistence compatibility
}

export const WATCHLIST_DEFAULT_FILTERS: WatchlistFilters = {
  mediaTypeFilter: "all",
  genreFilters: ["all"],
  sortBy: "date-added",
};

export const WATCHLIST_SORT_OPTIONS: SortOption[] = [
  { id: "date-added", label: "Sort: Date Added" },
  { id: "title", label: "Sort: Title (A-Z)" },
  { id: "year", label: "Sort: Year" },
  { id: "rating", label: "Sort: Rating" },
];

export function getWatchlistFilterSections(availableGenres: Set<string>) {
  return [
    {
      id: "mediaType",
      title: "Media Type",
      options: [
        { id: "all", label: "All Media" },
        { id: "movie", label: "Movies" },
        { id: "tv", label: "TV Shows" },
      ],
    },
    {
      id: "genre",
      title: "Genre",
      multiSelect: true,
      options: [
        { id: "all", label: "All Genres" },
        ...Array.from(availableGenres)
          .sort()
          .map((genre) => ({
            id: genre,
            label: genre.charAt(0).toUpperCase() + genre.slice(1),
          })),
      ],
    },
    {
      id: "sort",
      title: "Sort By",
      options: WATCHLIST_SORT_OPTIONS.map((opt) => ({
        id: opt.id,
        label: opt.label.replace("Sort: ", ""),
      })),
    },
  ];
}
