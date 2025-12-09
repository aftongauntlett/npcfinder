import React from "react";
import { X } from "lucide-react";
import { getGenreColor } from "../../../utils/genreColors";
import type { FilterSortSection } from "./FilterSortMenu";

interface ActiveFilterChipsProps {
  sections: FilterSortSection[];
  activeFilters: Record<string, string | string[]>;
  onRemoveFilter: (sectionId: string, filterId: string) => void;
}

/**
 * ActiveFilterChips - Displays active filters as removable chips
 *
 * Shows chips for each active filter selection, allowing users to remove
 * individual filters by clicking the X button on each chip.
 * Styled to match GenreChips for consistency.
 */
const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  sections,
  activeFilters,
  onRemoveFilter,
}) => {
  const chips: Array<{
    sectionId: string;
    sectionTitle: string;
    filterId: string;
    label: string;
  }> = [];

  // Build list of active filter chips
  sections.forEach((section) => {
    // Skip sort sections as they're not filters
    if (section.id === "sort") return;

    const activeValue = activeFilters[section.id];

    if (section.multiSelect && Array.isArray(activeValue)) {
      // Multi-select: show chips for each selected option (except "all")
      activeValue.forEach((filterId) => {
        if (filterId === "all") return;

        const option = section.options.find((opt) => opt.id === filterId);
        if (option) {
          chips.push({
            sectionId: section.id,
            sectionTitle: section.title,
            filterId,
            label: option.label,
          });
        }
      });
    } else if (typeof activeValue === "string" && activeValue !== "all") {
      // Single select: show chip if not "all"
      const option = section.options.find((opt) => opt.id === activeValue);
      if (option) {
        chips.push({
          sectionId: section.id,
          sectionTitle: section.title,
          filterId: activeValue,
          label: option.label,
        });
      }
    }
  });

  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="list"
      aria-label="Active filters"
    >
      {chips.map((chip, index) => {
        const handleRemove = () =>
          onRemoveFilter(chip.sectionId, chip.filterId);

        // Use genre color if available, otherwise use default primary color
        const colorClass = getGenreColor(chip.filterId.toLowerCase());

        return (
          <button
            key={`${chip.sectionId}-${chip.filterId}-${index}`}
            onClick={handleRemove}
            className={`inline-flex items-center gap-1.5 font-medium px-3 py-1.5 text-xs rounded-full ${colorClass} hover:opacity-80 transition-opacity duration-200 cursor-pointer border-0`}
            aria-label={`Remove ${chip.sectionTitle}: ${chip.label}`}
            type="button"
          >
            <span>{chip.label}</span>
            <X className="w-3 h-3 flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
};

export default ActiveFilterChips;
