import React, { useState, useEffect, useId } from "react";
import { Search } from "lucide-react";

export interface LocalSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  filterButton?: React.ReactNode;
  id?: string;
}

/**
 * LocalSearchInput - A debounced search input for filtering local data
 *
 * Features:
 * - 300ms debounce to prevent excessive re-renders
 * - Proper layout with filter button, divider, input field, and search icon
 * - Accessible with proper ARIA labels
 * - Compact design for inline toolbar usage
 * - Unique IDs per instance to avoid duplicate ID issues
 *
 * @example
 * <LocalSearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search items..."
 *   filterButton={<FilterSortMenu ... />}
 * />
 */
const LocalSearchInput: React.FC<LocalSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  filterButton,
  id,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const autoId = useId();
  const inputId = id || `local-search-${autoId}`;

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localValue, onChange]);

  return (
    <div
      className={`relative flex items-center gap-0 bg-gray-700/50 border border-gray-600 rounded-lg transition-colors ${
        isFocused ? "ring-2 ring-primary ring-offset-0" : ""
      } ${className}`}
    >
      {/* Filter Button */}
      {filterButton && (
        <>
          <div className="pl-3 pr-2">{filterButton}</div>
          {/* Divider */}
          <div className="h-5 w-px bg-gray-600" />
        </>
      )}

      {/* Input Field */}
      <input
        id={inputId}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-0 outline-none px-3 py-2 text-white placeholder-gray-500 min-w-0"
        aria-label={placeholder}
      />

      {/* Search Icon */}
      <div className="pr-3 pl-2 flex items-center group cursor-pointer">
        <Search
          className="w-4 h-4 text-gray-400 group-hover:text-theme-primary transition-colors"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default LocalSearchInput;
