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
        className="block text-sm font-medium text-primary mb-2"
      >
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none transition-colors text-left"
        style={{ outline: "none" }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = themeColor;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColor}33`;
        }}
        onMouseLeave={(e) => {
          if (document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }
        }}
      >
        <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 max-h-60 overflow-auto">
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
