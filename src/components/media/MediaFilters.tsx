import React from "react";
import { Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/shared";

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
                className="appearance-none bg-gray-100 dark:bg-gray-800 border-2 border-transparent rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none"
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
                <Button
                  key={option.value}
                  onClick={() => onFilterChange(filter.id, option.value)}
                  variant={
                    activeFilters[filter.id] === option.value
                      ? "primary"
                      : "subtle"
                  }
                  size="sm"
                  aria-pressed={activeFilters[filter.id] === option.value}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default MediaFilters;
