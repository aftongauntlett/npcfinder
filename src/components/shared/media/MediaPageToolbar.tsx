import { Plus, Minimize2 } from "lucide-react";
import Button from "../ui/Button";
import FilterSortMenu from "../common/FilterSortMenu";
import LocalSearchInput from "../common/LocalSearchInput";
import ActiveFilterChips from "../common/ActiveFilterChips";

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

interface SearchConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface MediaPageToolbarProps {
  filterConfig?: MenuFilterConfig;
  searchConfig?: SearchConfig;
  onAddClick: () => void;
  onCollapseAll?: () => void;
  hasExpandedItems?: boolean;
}

export function MediaPageToolbar(props: MediaPageToolbarProps) {
  const { filterConfig, onAddClick, searchConfig, onCollapseAll, hasExpandedItems } = props;

  const handleRemoveFilter = (sectionId: string, filterId: string) => {
    if (!filterConfig) return;
    
    const section = filterConfig.sections.find((s) => s.id === sectionId);
    if (!section) return;

    if (section.multiSelect) {
      const currentValues = Array.isArray(filterConfig.activeFilters[sectionId])
        ? (filterConfig.activeFilters[sectionId] as string[])
        : [];
      const newValues = currentValues.filter((id) => id !== filterId);
      filterConfig.onFilterChange(sectionId, newValues.length === 0 ? ["all"] : newValues);
    } else {
      filterConfig.onFilterChange(sectionId, "all");
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="w-full flex items-center gap-3 sm:flex-1 min-w-0 flex-wrap">
        {/* Search with Filter Button */}
        {searchConfig && (
          <div className="w-full flex items-center gap-2 sm:w-[420px] sm:max-w-full">
            <div className="flex-1 min-w-0">
              <LocalSearchInput
                value={searchConfig.value}
                onChange={searchConfig.onChange}
                placeholder={searchConfig.placeholder || "Search..."}
                filterButton={
                  filterConfig?.type === "menu" ? (
                    <FilterSortMenu
                      sections={filterConfig.sections}
                      activeFilters={filterConfig.activeFilters}
                      onFilterChange={filterConfig.onFilterChange}
                      label=""
                    />
                  ) : undefined
                }
              />
            </div>

            {/* Mobile: icon-only add button inline with search */}
            <Button
              onClick={onAddClick}
              variant="action"
              size="icon"
              icon={<Plus size={18} />}
              className="sm:hidden"
              aria-label="Add"
              title="Add"
            />
          </div>
        )}

        {/* Active Filter Chips */}
        {filterConfig?.type === "menu" && (
          <div className="hidden sm:block">
            <ActiveFilterChips
              sections={filterConfig.sections}
              activeFilters={filterConfig.activeFilters}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>
        )}
      </div>

      <div className="hidden sm:flex w-full sm:w-auto items-center justify-end gap-2">
        {hasExpandedItems && onCollapseAll && (
          <Button
            onClick={onCollapseAll}
            variant="subtle"
            size="sm"
            icon={<Minimize2 className="w-4 h-4" />}
            aria-label="Collapse all items"
            title="Collapse all items"
            hideTextOnMobile
          >
            Collapse All
          </Button>
        )}
        <Button
          onClick={onAddClick}
          variant="action"
          size="md"
          icon={<Plus size={18} />}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

export default MediaPageToolbar;
