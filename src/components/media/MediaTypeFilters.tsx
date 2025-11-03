import React from "react";
import { LucideIcon } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  colorClass?: string;
}

interface MediaTypeFiltersProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

const MediaTypeFilters: React.FC<MediaTypeFiltersProps> = ({
  filters,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const Icon = filter.icon;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? filter.colorClass ||
                  "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white ring-2 ring-gray-400 dark:ring-gray-600"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

export default MediaTypeFilters;
