import { Check } from "lucide-react";
import type { FilterSortOption as FilterSortOptionType } from "./FilterSortMenu";

interface FilterSortOptionProps {
  option: FilterSortOptionType;
  isActive: boolean;
  onClick: (event: React.MouseEvent) => void;
}

/**
 * FilterSortOption - Single option button for filter/sort menu
 *
 * Renders a single option button with active state styling and check icon.
 */
const FilterSortOption: React.FC<FilterSortOptionProps> = ({
  option,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        isActive
          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
    >
      <span>{option.label}</span>
      {isActive && (
        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      )}
    </button>
  );
};

export default FilterSortOption;
