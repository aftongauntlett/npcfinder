export const GAME_LIBRARY_PERSISTENCE_KEY = "gameLibrary";

export type GameLibrarySortType = "custom" | "date-added" | "name" | "year" | "rating";

export interface GameLibraryFilters {
  genreFilters: string[];
  sortBy: GameLibrarySortType;
  [key: string]: string | string[] | number | boolean; // Index signature for persistence compatibility
}

export const GAME_LIBRARY_DEFAULT_FILTERS: GameLibraryFilters = {
  genreFilters: ["all"],
  sortBy: "custom",
};

export function getGameLibraryFilterSections(availableGenres: Set<string>) {
  const sortedGenres = Array.from(availableGenres).sort();

  const genreOptions = [
    { id: "all", label: "All Genres" },
    ...sortedGenres.map((genre) => ({
      id: genre,
      label: genre.charAt(0).toUpperCase() + genre.slice(1),
    })),
  ];

  return [
    {
      id: "genre",
      title: "Genre",
      multiSelect: true,
      options: genreOptions,
    },
    {
      id: "sort",
      title: "Sort By",
      options: [
        { id: "custom", label: "Custom" },
        { id: "date-added", label: "Recently Added" },
        { id: "name", label: "Name (A-Z)" },
        { id: "year", label: "Release Year" },
        { id: "rating", label: "Your Rating" },
      ],
    },
  ];
}
