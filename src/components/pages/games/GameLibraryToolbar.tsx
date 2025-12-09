import React from "react";
import { MediaPageToolbar } from "../../shared/media/MediaPageToolbar";
import { getGameLibraryFilterSections } from "../../../data/gameLibraryFilters";
import type { GameLibrarySortType } from "../../../data/gameLibraryFilters";

interface GameLibraryToolbarProps {
  availableGenres: Set<string>;
  genreFilters: string[];
  activeSort: GameLibrarySortType;
  onGenresChange: (genres: string[]) => void;
  onSortChange: (sort: GameLibrarySortType) => void;
  onAddClick: () => void;
}

const GameLibraryToolbar: React.FC<GameLibraryToolbarProps> = ({
  availableGenres,
  genreFilters,
  activeSort,
  onGenresChange,
  onSortChange,
  onAddClick,
}) => {
  const filterSections = getGameLibraryFilterSections(availableGenres);

  return (
    <div className="space-y-3 mb-6">
      <MediaPageToolbar
        filterConfig={{
          type: "menu",
          sections: filterSections,
          activeFilters: {
            genre: genreFilters,
            sort: activeSort,
          },
          onFilterChange: (sectionId, value) => {
            if (sectionId === "genre") {
              const genres = Array.isArray(value) ? value : [value];
              onGenresChange(genres);
            } else if (sectionId === "sort") {
              onSortChange(value as GameLibrarySortType);
            }
          },
        }}
        onAddClick={onAddClick}
      />
    </div>
  );
};

export default GameLibraryToolbar;
