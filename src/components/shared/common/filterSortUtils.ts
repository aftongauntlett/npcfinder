import type { FilterSortSection } from "./FilterSortMenu";

/**
 * Helper function to extract active filter chips data
 * Use this when you need to render chips separately from the menu
 */
export const getActiveFilterChipsData = (
  sections: FilterSortSection[],
  activeFilters: Record<string, string | string[]>
) => {
  const chips: Array<{
    sectionId: string;
    sectionTitle: string;
    filterId: string;
    label: string;
  }> = [];

  sections.forEach((section) => {
    if (section.id === "sort") return;

    const activeValue = activeFilters[section.id];

    if (section.multiSelect && Array.isArray(activeValue)) {
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

  return chips;
};
