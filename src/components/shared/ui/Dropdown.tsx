import React, { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";

type DropdownSize = "sm" | "md" | "lg";

export interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiSelect?: boolean;
  size?: DropdownSize;
  className?: string;
  dropdownClassName?: string;
  align?: "left" | "right";
}

const sizeClasses = {
  sm: "text-sm py-1.5 px-3",
  md: "text-base py-2 px-4",
  lg: "text-lg py-2.5 px-5",
};

/**
 * Reusable Dropdown component for custom dropdown menus
 * Supports single and multi-select modes with keyboard navigation
 */
const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  options,
  value,
  onChange,
  multiSelect = false,
  size = "md",
  className = "",
  dropdownClassName = "",
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

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
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].id);
        }
        break;
    }
  };

  const handleSelect = (optionId: string) => {
    if (!onChange) return;

    if (multiSelect) {
      const newValue = selectedValues.includes(optionId)
        ? selectedValues.filter((v) => v !== optionId)
        : [...selectedValues, optionId];
      onChange(newValue);
    } else {
      onChange(optionId);
      setIsOpen(false);
    }
  };

  const isSelected = (optionId: string) => selectedValues.includes(optionId);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-dropdown mt-2 min-w-[200px]
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            ${align === "right" ? "right-0" : "left-0"}
            ${dropdownClassName}
          `
            .trim()
            .replace(/\s+/g, " ")}
          role="listbox"
          aria-multiselectable={multiSelect}
        >
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => !option.disabled && handleSelect(option.id)}
              onMouseEnter={() => setFocusedIndex(index)}
              disabled={option.disabled}
              className={`
                w-full flex items-center justify-between
                ${sizeClasses[size]}
                text-left transition-colors
                ${
                  option.disabled
                    ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }
                ${focusedIndex === index ? "bg-gray-100 dark:bg-gray-700" : ""}
                ${isSelected(option.id) ? "bg-primary/5" : ""}
                ${index === 0 ? "rounded-t-lg" : ""}
                ${index === options.length - 1 ? "rounded-b-lg" : ""}
              `
                .trim()
                .replace(/\s+/g, " ")}
              role="option"
              aria-selected={isSelected(option.id)}
            >
              <span className="flex items-center gap-2">
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                {option.label}
              </span>
              {isSelected(option.id) && (
                <Check
                  className="w-4 h-4 text-primary flex-shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
