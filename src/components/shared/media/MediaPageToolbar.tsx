import { Minimize2 } from "lucide-react";
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
  addLabel?: string;
  addIcon?: React.ReactNode;
  rightActions?: React.ReactNode;
  hideAddButton?: boolean;
  onCollapseAll?: () => void;
  hasExpandedItems?: boolean;
  compactSpacing?: boolean;
}

export function MediaPageToolbar(props: MediaPageToolbarProps) {
  const {
    filterConfig,
    onAddClick,
    searchConfig,
    onCollapseAll,
    hasExpandedItems,
    addLabel = "+ Add",
    addIcon,
    rightActions,
    hideAddButton = false,
    compactSpacing = false,
  } = props;

  const handleRemoveFilter = (sectionId: string, filterId: string) => {
    if (!filterConfig) return;

    const section = filterConfig.sections.find((s) => s.id === sectionId);
    if (!section) return;

    if (section.multiSelect) {
      const currentValues = Array.isArray(filterConfig.activeFilters[sectionId])
        ? (filterConfig.activeFilters[sectionId] as string[])
        : [];
      const newValues = currentValues.filter((id) => id !== filterId);
      filterConfig.onFilterChange(
        sectionId,
        newValues.length === 0 ? ["all"] : newValues,
      );
    } else {
      filterConfig.onFilterChange(sectionId, "all");
    }
  };

  const actionButtonClassName =
    "h-9 w-9 rounded-full border-0 bg-gray-100/80 shadow-sm backdrop-blur-sm hover:bg-gray-200/80 dark:bg-gray-700/70 dark:hover:bg-gray-600/80";

  const containerSpacingClass = compactSpacing ? "mb-2 gap-2" : "mb-4 gap-3";

  return (
    <div className={`relative z-20 flex flex-col ${containerSpacingClass}`}>
      <div className="flex w-full items-center gap-2">
        {searchConfig && (
          <div className="min-w-0 flex-1">
            <LocalSearchInput
              value={searchConfig.value}
              onChange={searchConfig.onChange}
              placeholder={searchConfig.placeholder || "Search..."}
              className="w-full"
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

        <div className="flex items-center gap-2">
          {hasExpandedItems && onCollapseAll && (
            <Button
              onClick={onCollapseAll}
              variant="subtle"
              size="icon"
              icon={<Minimize2 className="h-4 w-4" />}
              aria-label="Collapse all items"
              title="Collapse all items"
              className={actionButtonClassName}
            />
          )}
          {rightActions}
          {!hideAddButton && (
            <Button
              onClick={onAddClick}
              variant="action"
              size="sm"
              icon={addIcon}
              aria-label={addLabel}
              title={addLabel}
              className="h-9 rounded-full border-0 px-3 text-sm font-semibold shadow-sm"
            >
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {filterConfig?.type === "menu" && (
        <div>
          <ActiveFilterChips
            sections={filterConfig.sections}
            activeFilters={filterConfig.activeFilters}
            onRemoveFilter={handleRemoveFilter}
          />
        </div>
      )}
    </div>
  );
}

export default MediaPageToolbar;
