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
  onMediaTypeChange: (type: MediaTypeFilter) => void;
  onGenresChange: (genres: string[]) => void;
  onSortChange: (sort: WatchlistSortType) => void;
  onAddClick: () => void;
}

const WatchlistToolbar: React.FC<WatchlistToolbarProps> = ({
  availableGenres,
  mediaTypeFilter,
  genreFilters,
  sortBy,
  onMediaTypeChange,
  onGenresChange,
  onSortChange,
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
      onAddClick={onAddClick}
    />
  );
};

export default WatchlistToolbar;
