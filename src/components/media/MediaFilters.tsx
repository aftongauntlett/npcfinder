import React from "react";
import { Filter } from "lucide-react";
import { Button, Select } from "@/components/shared";

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
            <Select
              value={activeFilters[filter.id] || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFilterChange(filter.id, e.target.value)
              }
              options={filter.options}
              placeholder={filter.label}
              aria-label={filter.label}
            />
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
