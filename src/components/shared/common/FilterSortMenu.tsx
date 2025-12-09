import React, { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import FilterSortSection from "./FilterSortSection";
import ActiveFilterChips from "./ActiveFilterChips";
import Button from "../ui/Button";

export interface FilterSortOption {
  id: string;
  label: string;
  colorClass?: string;
}

export interface FilterSortSection {
  id: string;
  title: string;
  options: FilterSortOption[];
  multiSelect?: boolean; // Allow multiple selections
}

interface FilterSortMenuProps {
  sections: FilterSortSection[];
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (sectionId: string, filterId: string | string[]) => void;
  label?: string;
}

/**
 * Combined filter and sort dropdown menu
 * Modern alternative to chips for scalable filtering/sorting
 * Uses Dropdown component infrastructure with custom multi-section rendering
 */
const FilterSortMenu: React.FC<FilterSortMenuProps> = ({
  sections,
  activeFilters,
  onFilterChange,
  label = "Filters & Sort",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleOptionClick = (
    section: FilterSortSection,
    optionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (section.multiSelect) {
      // Multi-select: toggle the option in the array
      const currentValues = Array.isArray(activeFilters[section.id])
        ? (activeFilters[section.id] as string[])
        : [];

      let newValues: string[];

      if (optionId === "all") {
        // Clicking "All" should clear all other selections
        newValues = ["all"];
      } else {
        // Clicking a specific option
        if (currentValues.includes(optionId)) {
          // Deselecting: remove it
          newValues = currentValues.filter((id) => id !== optionId);
          // If nothing left, default to "all"
          if (newValues.length === 0) {
            newValues = ["all"];
          }
        } else {
          // Selecting: add it and remove "all"
          newValues = [...currentValues.filter((id) => id !== "all"), optionId];
        }
      }

      onFilterChange(section.id, newValues);
    } else {
      // Single select: replace the value
      onFilterChange(section.id, optionId);
    }
  };

  const isOptionActive = (section: FilterSortSection, optionId: string) => {
    if (section.multiSelect) {
      const values = activeFilters[section.id];
      return Array.isArray(values) && values.includes(optionId);
    }
    return activeFilters[section.id] === optionId;
  };

  const handleRemoveFilter = (sectionId: string, filterId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    if (section.multiSelect) {
      // Multi-select: remove the specific filter
      const currentValues = Array.isArray(activeFilters[sectionId])
        ? (activeFilters[sectionId] as string[])
        : [];

      const newValues = currentValues.filter((id) => id !== filterId);
      // If nothing left, default to "all"
      onFilterChange(sectionId, newValues.length === 0 ? ["all"] : newValues);
    } else {
      // Single select: reset to "all"
      onFilterChange(sectionId, "all");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative inline-block">
        {/* Trigger Button */}
        <Button
          ref={triggerRef}
          variant="subtle"
          size="sm"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-label="Filter and sort"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {label}
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-dropdown max-h-[400px] overflow-y-auto"
            role="listbox"
          >
            {sections.map((section, sectionIndex) => (
              <div key={section.id}>
                <FilterSortSection
                  section={section}
                  activeFilters={activeFilters}
                  onOptionClick={handleOptionClick}
                  isOptionActive={isOptionActive}
                />

                {/* Divider between sections */}
                {sectionIndex < sections.length - 1 && (
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Filter Chips - inline on same row */}
      <ActiveFilterChips
        sections={sections}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
      />
    </div>
  );
};

export default FilterSortMenu;
