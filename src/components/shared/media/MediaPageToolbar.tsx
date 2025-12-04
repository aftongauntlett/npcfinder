import { Plus, SlidersHorizontal } from "lucide-react";
import { useId, useState, useRef, useEffect } from "react";
import Button from "../ui/Button";
import Select from "../ui/Select";
import FilterSortMenu from "../common/FilterSortMenu";
import MediaTypeFilters from "../../media/MediaTypeFilters";
import type { FilterOption } from "../../media/MediaTypeFilters";
import type { SortOption } from "../types";

interface ChipFilterConfig {
  type: "chips";
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  renderAsPopover?: boolean;
}

interface MenuFilterConfig {
  type: "menu";
  sections: Array<{
    id: string;
    title: string;
    options: Array<{ id: string; label: string; colorClass?: string }>;
    multiSelect?: boolean;
  }>;
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (sectionId: string, filterId: string | string[]) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

interface SortConfig {
  options: SortOption[];
  activeSort: string;
  onSortChange: (value: string) => void;
}

type MediaPageToolbarProps =
  | {
      filterConfig?: ChipFilterConfig | null;
      sortConfig: SortConfig;
      onAddClick: () => void;
    }
  | {
      filterConfig: MenuFilterConfig;
      sortConfig?: never;
      onAddClick: () => void;
    };

export function MediaPageToolbar(props: MediaPageToolbarProps) {
  const { filterConfig, onAddClick } = props;
  const sortConfig = "sortConfig" in props ? props.sortConfig : undefined;
  const selectId = useId();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showPopover) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 flex-1">
        {filterConfig?.type === "chips" && !filterConfig.renderAsPopover && (
          <MediaTypeFilters
            activeFilter={filterConfig.activeFilter}
            onFilterChange={filterConfig.onFilterChange}
            filters={filterConfig.options}
          />
        )}

        {filterConfig?.type === "chips" && filterConfig.renderAsPopover && (
          <div className="relative" ref={popoverRef}>
            <Button
              onClick={() => setShowPopover(!showPopover)}
              variant="secondary"
              size="md"
              icon={<SlidersHorizontal className="w-4 h-4" />}
              aria-expanded={showPopover}
              aria-haspopup="true"
            >
              Filters
            </Button>

            {showPopover && (
              <div className="absolute top-full left-0 mt-2 p-4 bg-surface border-2 border-primary/20 rounded-lg shadow-xl z-20 min-w-[200px]">
                <MediaTypeFilters
                  activeFilter={filterConfig.activeFilter}
                  onFilterChange={(value) => {
                    filterConfig.onFilterChange(value);
                    setShowPopover(false);
                  }}
                  filters={filterConfig.options}
                />
              </div>
            )}
          </div>
        )}

        {filterConfig?.type === "menu" && (
          <FilterSortMenu
            sections={filterConfig.sections}
            activeFilters={filterConfig.activeFilters}
            onFilterChange={filterConfig.onFilterChange}
            onResetFilters={filterConfig.onResetFilters}
            hasActiveFilters={filterConfig.hasActiveFilters}
          />
        )}

        {/* Sort dropdown for pages without menu filters */}
        {(!filterConfig || filterConfig.type === "chips") && sortConfig && (
          <div className="flex items-center gap-2">
            <label
              htmlFor={selectId}
              className="text-sm font-medium text-secondary"
            >
              Sort by:
            </label>
            <Select
              id={selectId}
              value={sortConfig.activeSort}
              onChange={(e) => sortConfig.onSortChange(e.target.value)}
            >
              {sortConfig.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <Button
        onClick={onAddClick}
        variant="action"
        size="md"
        icon={<Plus size={18} />}
      >
        Add
      </Button>
    </div>
  );
}

export default MediaPageToolbar;
