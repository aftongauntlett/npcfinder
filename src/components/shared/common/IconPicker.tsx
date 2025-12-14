import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { IconOption } from "@/utils/taskIcons";

interface IconPickerProps {
  selectedIcon: string | null;
  onIconChange: (icon: string | null) => void;
  icons?: IconOption[];
}

export default function IconPicker({
  selectedIcon,
  onIconChange,
  icons,
}: IconPickerProps) {
  const options = useMemo(() => icons ?? [], [icons]);

  const noneIndex = 0;
  const gridOptions = useMemo(
    () => [{ name: "None" } as const, ...options],
    [options]
  );

  const selectedIndex = useMemo(() => {
    if (!selectedIcon) return noneIndex;
    const foundIndex = options.findIndex((o) => o.name === selectedIcon);
    return foundIndex >= 0 ? foundIndex + 1 : noneIndex;
  }, [options, selectedIcon]);

  const [activeIndex, setActiveIndex] = useState<number>(selectedIndex);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  const focusIndex = useCallback((index: number) => {
    setActiveIndex(index);
    buttonsRef.current[index]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      const cols = isDesktop ? 8 : 5;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        focusIndex(Math.min(index + 1, gridOptions.length - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusIndex(Math.max(index - 1, 0));
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusIndex(Math.min(index + cols, gridOptions.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        focusIndex(Math.max(index - cols, 0));
      }
      if (e.key === "Home") {
        e.preventDefault();
        focusIndex(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        focusIndex(gridOptions.length - 1);
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (index === noneIndex) {
          onIconChange(null);
        } else {
          onIconChange(options[index - 1].name);
        }
      }
    },
    [focusIndex, gridOptions.length, noneIndex, onIconChange, options]
  );

  return (
    <div className="space-y-2">
      <div
        className="grid grid-cols-5 md:grid-cols-8 gap-2"
        role="listbox"
        aria-label="Icon picker"
      >
        {gridOptions.map((opt, index) => {
          const isNone = index === noneIndex;
          const isSelected = index === selectedIndex;
          const IconComponent = !isNone ? (opt as IconOption).icon : null;

          return (
            <button
              key={opt.name}
              ref={(el) => {
                buttonsRef.current[index] = el;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              tabIndex={index === activeIndex ? 0 : -1}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() =>
                onIconChange(isNone ? null : (opt as IconOption).name)
              }
              className={`flex items-center justify-center rounded-md border transition-colors h-9 w-9 md:h-10 md:w-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isSelected
                  ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              aria-label={isNone ? "No icon" : (opt as IconOption).name}
              title={isNone ? "None" : (opt as IconOption).name}
            >
              {isNone ? (
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                  None
                </span>
              ) : IconComponent ? (
                <IconComponent className="w-5 h-5" weight="regular" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
