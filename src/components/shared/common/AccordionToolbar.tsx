/**
 * AccordionToolbar Component
 * 
 * Reusable toolbar for pages with accordion lists
 * Includes search input, filter menu, collapse all button, and action button
 */

import React from "react";
import { Plus, Minimize2 } from "lucide-react";
import LocalSearchInput from "./LocalSearchInput";
import FilterSortMenu from "./FilterSortMenu";
import ActiveFilterChips from "./ActiveFilterChips";
import Button from "../ui/Button";
import type { FilterSortSection } from "./FilterSortMenu";

interface AccordionToolbarProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Filter/Sort
  filterSortSections?: FilterSortSection[];
  activeFilters?: Record<string, string | string[]>;
  onFilterChange?: (sectionId: string, value: string | string[]) => void;

  // Collapse All - only shows when items are expanded
  onCollapseAll: () => void;
  hasExpandedItems?: boolean; // Show collapse button only when true

  // Action Button
  onActionClick: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;

  // Layout
  className?: string;
}

/**
 * AccordionToolbar - Consistent toolbar for accordion-based views
 * 
 * @example
 * const [collapseKey, setCollapseKey] = useState(0);
 * 
 * <AccordionToolbar
 *   searchValue={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   searchPlaceholder="Search Jobs..."
 *   filterSortSections={filterSections}
 *   activeFilters={activeFilters}
 *   onFilterChange={handleFilterChange}
 *   onCollapseAll={() => setCollapseKey(prev => prev + 1)}
 *   onActionClick={onCreate}
 *   actionLabel="Add"
 * />
 * 
 * {items.map(item => <JobCard key={`${item.id}-${collapseKey}`} ... />)}
 */
const AccordionToolbar: React.FC<AccordionToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterSortSections,
  activeFilters,
  onFilterChange,
  onCollapseAll,
  hasExpandedItems = false,
  onActionClick,
  actionLabel = "Add",
  actionIcon = <Plus className="w-4 h-4" />,
  className = "",
}) => {
  const handleRemoveFilter = (sectionId: string, filterId: string) => {
    if (!filterSortSections || !activeFilters || !onFilterChange) return;
    
    const section = filterSortSections.find((s) => s.id === sectionId);
    if (!section) return;

    if (section.multiSelect) {
      const currentValues = Array.isArray(activeFilters[sectionId])
        ? (activeFilters[sectionId] as string[])
        : [];
      const newValues = currentValues.filter((id) => id !== filterId);
      onFilterChange(sectionId, newValues.length === 0 ? ["all"] : newValues);
    } else {
      onFilterChange(sectionId, "all");
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
        {/* Search with Filter Button */}
        <div className="w-[420px] max-w-full">
          <LocalSearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            filterButton={
              filterSortSections && activeFilters && onFilterChange ? (
                <FilterSortMenu
                  sections={filterSortSections}
                  activeFilters={activeFilters}
                  onFilterChange={onFilterChange}
                  label=""
                />
              ) : undefined
            }
          />
        </div>

        {/* Active Filter Chips - inline with search */}
        {filterSortSections && activeFilters && onFilterChange && (
          <ActiveFilterChips
            sections={filterSortSections}
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasExpandedItems && (
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
          onClick={onActionClick}
          variant="action"
          size="sm"
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};

export default AccordionToolbar;
