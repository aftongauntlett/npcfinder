import { Plus, SlidersHorizontal } from "lucide-react";
import { useId, useState, useRef, useEffect } from "react";
import Button from "../ui/Button";
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
            <select
              id={selectId}
              value={sortConfig.activeSort}
              onChange={(e) => sortConfig.onSortChange(e.target.value)}
              className="appearance-none px-4 pr-10 py-2 rounded-lg border-2 border-transparent bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium shadow-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23737373%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] dark:bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a3a3a3%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat"
            >
              {sortConfig.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
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
