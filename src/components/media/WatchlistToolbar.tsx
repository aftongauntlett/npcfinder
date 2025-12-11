import React from "react";
import { MediaPageToolbar } from "@/components/shared";
import { getWatchlistFilterSections } from "../../data/watchlistFilters";
import type {
  MediaTypeFilter,
  WatchlistSortType,
} from "../../data/watchlistFilters";

interface WatchlistToolbarProps {
  availableGenres: Set<string>;
  mediaTypeFilter: MediaTypeFilter;
  genreFilters: string[];
  sortBy: WatchlistSortType;
  searchQuery: string;
  onMediaTypeChange: (type: MediaTypeFilter) => void;
  onGenresChange: (genres: string[]) => void;
  onSortChange: (sort: WatchlistSortType) => void;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
}

const WatchlistToolbar: React.FC<WatchlistToolbarProps> = ({
  availableGenres,
  mediaTypeFilter,
  genreFilters,
  sortBy,
  searchQuery,
  onMediaTypeChange,
  onGenresChange,
  onSortChange,
  onSearchChange,
  onAddClick,
}) => {
  const filterSections = getWatchlistFilterSections(availableGenres);

  return (
    <MediaPageToolbar
      filterConfig={{
        type: "menu",
        sections: filterSections,
        activeFilters: {
          mediaType: mediaTypeFilter,
          genre: genreFilters,
          sort: sortBy,
        },
        onFilterChange: (sectionId, filterId) => {
          if (sectionId === "mediaType") {
            onMediaTypeChange(filterId as MediaTypeFilter);
          } else if (sectionId === "genre") {
            const genres = Array.isArray(filterId) ? filterId : [filterId];
            onGenresChange(genres);
          } else if (sectionId === "sort") {
            onSortChange(filterId as WatchlistSortType);
          }
        },
      }}
      searchConfig={{
        value: searchQuery,
        onChange: onSearchChange,
        placeholder: "Search Movies and TV Shows...",
      }}
      onAddClick={onAddClick}
    />
  );
};

export default WatchlistToolbar;
