import React from "react";
import { ChevronDown } from "lucide-react";

type FilterType = "select" | "buttons";

interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  id: string;
  label: string;
  type: FilterType;
  options: FilterOption[];
}

interface MediaFiltersProps {
  filters: Filter[];
  activeFilters: Record<string, string>;
  onFilterChange: (filterId: string, value: string) => void;
}

const MediaFilters: React.FC<MediaFiltersProps> = ({
  filters,
  activeFilters,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => (
        <div key={filter.id} className="relative">
          {filter.type === "select" ? (
            <div className="relative">
              <select
                value={activeFilters[filter.id] || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
                aria-label={filter.label}
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          ) : filter.type === "buttons" ? (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={filter.label}
            >
              {filter.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(filter.id, option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilters[filter.id] === option.value
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={activeFilters[filter.id] === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default MediaFilters;
