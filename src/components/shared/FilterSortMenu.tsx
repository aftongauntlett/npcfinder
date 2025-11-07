import React, { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Check } from "lucide-react";

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
}

/**
 * Combined filter and sort dropdown menu
 * Modern alternative to chips for scalable filtering/sorting
 */
const FilterSortMenu: React.FC<FilterSortMenuProps> = ({
  sections,
  activeFilters,
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

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
      // Single select: replace the value and close menu
      onFilterChange(section.id, optionId);
      setIsOpen(false);
    }
  };

  const isOptionActive = (section: FilterSortSection, optionId: string) => {
    if (section.multiSelect) {
      const values = activeFilters[section.id];
      return Array.isArray(values) && values.includes(optionId);
    }
    return activeFilters[section.id] === optionId;
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button - Icon + Text */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
          isOpen
            ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
        aria-label="Filter and sort"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Filters &amp; Sort</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[400px] overflow-y-auto">
          {sections.map((section, sectionIndex) => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.title}
              </div>

              {/* Section Options */}
              <div className="space-y-1 px-2">
                {section.options.map((option) => {
                  const isActive = isOptionActive(section, option.id);

                  return (
                    <button
                      key={option.id}
                      onClick={(e) => handleOptionClick(section, option.id, e)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        isActive
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isActive && (
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider between sections */}
              {sectionIndex < sections.length - 1 && (
                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterSortMenu;
