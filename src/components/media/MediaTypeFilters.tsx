import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/shared";

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
          <Button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            variant={isActive ? "primary" : "subtle"}
            size="sm"
            icon={Icon ? <Icon className="w-4 h-4" /> : undefined}
            className={
              isActive && filter.colorClass ? filter.colorClass : undefined
            }
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
};

export default MediaTypeFilters;
