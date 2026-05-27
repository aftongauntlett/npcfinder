import React, { useState, useEffect, useId, useRef } from "react";
import { Search, X } from "lucide-react";

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
 * - Filter button + divider layout for compact toolbars
 * - Inline clear control that replaces the search icon when text exists
 * - Accessible with proper ARIA labels
 * - Compact design that can also stretch full-width
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
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const inputId = id || `local-search-${autoId}`;
  const hasValue = localValue.trim().length > 0;

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback
  useEffect(() => {
    if (localValue === value) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localValue, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div
      className={`relative flex h-11 items-center gap-0 rounded-xl border border-gray-200/80 bg-white/85 shadow-sm backdrop-blur-sm transition-colors dark:border-gray-600/80 dark:bg-gray-700/55 ${
        isFocused
          ? "ring-2 ring-primary/60 ring-offset-0 dark:ring-primary-light/60"
          : "hover:border-gray-300 dark:hover:border-gray-500"
      } ${className}`}
    >
      {/* Filter Button */}
      {filterButton && (
        <>
          <div className="pl-2 pr-2">{filterButton}</div>
          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-600" />
        </>
      )}

      {/* Input Field */}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="h-full flex-1 min-w-0 border-0 bg-transparent px-3 text-gray-900 outline-none placeholder-gray-400 dark:text-white dark:placeholder-gray-500"
        aria-label={placeholder}
      />

      <div className="pr-3 pl-1 flex items-center">
        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:text-gray-400 dark:hover:bg-gray-600/60 dark:hover:text-gray-200"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <Search
            className="h-4 w-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};

export default LocalSearchInput;
