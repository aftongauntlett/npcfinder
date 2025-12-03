/**
 * Custom Dropdown Component
 * Reusable styled dropdown matching app design
 */

import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CustomDropdownProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  themeColor: string;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select option",
  themeColor,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
      >
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 text-left ${
          isOpen
            ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
        }`}
        style={
          isOpen
            ? {
                borderColor: themeColor,
                boxShadow: `0 0 0 2px ${themeColor}33`,
              }
            : {}
        }
      >
        <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                value === option
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              style={
                value === option
                  ? {
                      backgroundColor: `${themeColor}10`,
                      color: themeColor,
                    }
                  : {}
              }
            >
              <span>{option}</span>
              {value === option && (
                <Check className="w-4 h-4" style={{ color: themeColor }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
