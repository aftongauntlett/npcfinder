import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SortOption {
  id: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  activeSort: string;
  onSortChange: (sortId: string) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  options,
  activeSort,
  onSortChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const activeOption = options.find((opt) => opt.id === activeSort);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="font-medium">{activeOption?.label || "Sort"}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
            {options.map((option) => {
              const isActive = activeSort === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    onSortChange(option.id);
                    setShowMenu(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                    isActive
                      ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {isActive && (
                    <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SortDropdown;
