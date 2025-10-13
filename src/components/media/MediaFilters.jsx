import React from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";

/**
 * Reusable filter component for media pages
 */
const MediaFilters = ({ filters, activeFilters, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => (
        <div key={filter.id} className="relative">
          {filter.type === "select" ? (
            <div className="relative">
              <select
                value={activeFilters[filter.id] || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                aria-label={filter.label}
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          ) : filter.type === "buttons" ? (
            <div className="flex gap-2">
              {filter.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(filter.id, option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilters[filter.id] === option.value
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={activeFilters[filter.id] === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

MediaFilters.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["select", "buttons"]).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  activeFilters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default MediaFilters;
