import FilterSortOption from "./FilterSortOption";
import type { FilterSortSection as FilterSortSectionType } from "./FilterSortMenu";

interface FilterSortSectionProps {
  section: FilterSortSectionType;
  activeFilters: Record<string, string | string[]>;
  onOptionClick: (
    section: FilterSortSectionType,
    optionId: string,
    event: React.MouseEvent
  ) => void;
  isOptionActive: (section: FilterSortSectionType, optionId: string) => boolean;
}

/**
 * FilterSortSection - Section renderer for filter/sort menu
 *
 * Renders a single section with its title and options.
 */
const FilterSortSection: React.FC<FilterSortSectionProps> = ({
  section,
  onOptionClick,
  isOptionActive,
}) => {
  return (
    <div>
      {/* Section Header */}
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {section.title}
      </div>

      {/* Section Options */}
      <div className="space-y-1 px-2">
        {section.options.map((option) => {
          const isActive = isOptionActive(section, option.id);

          return (
            <FilterSortOption
              key={option.id}
              option={option}
              isActive={isActive}
              onClick={(e) => onOptionClick(section, option.id, e)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FilterSortSection;
