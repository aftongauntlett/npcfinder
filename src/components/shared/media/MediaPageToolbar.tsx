import { Plus } from "lucide-react";
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
}

export function MediaPageToolbar(props: MediaPageToolbarProps) {
  const { filterConfig, onAddClick, searchConfig } = props;

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
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
        {/* Search with Filter Button */}
        {searchConfig && (
          <div className="w-[420px] max-w-full">
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
        )}

        {/* Active Filter Chips */}
        {filterConfig?.type === "menu" && (
          <ActiveFilterChips
            sections={filterConfig.sections}
            activeFilters={filterConfig.activeFilters}
            onRemoveFilter={handleRemoveFilter}
          />
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
