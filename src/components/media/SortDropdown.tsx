import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Button from "../shared/Button";

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
      <Button
        onClick={() => setShowMenu(!showMenu)}
        variant="secondary"
        size="sm"
        icon={<ChevronDown className="w-4 h-4" />}
        iconPosition="right"
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        {activeOption?.label || "Sort"}
      </Button>

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
                <Button
                  key={option.id}
                  onClick={() => {
                    onSortChange(option.id);
                    setShowMenu(false);
                  }}
                  variant="subtle"
                  size="sm"
                  fullWidth
                  icon={
                    isActive ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : undefined
                  }
                  className={`justify-start rounded-none ${
                    isActive ? "font-semibold" : ""
                  }`}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SortDropdown;
