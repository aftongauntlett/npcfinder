import React from "react";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "list" | "grid";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  optionsLabel?: string;
}

const buttonBaseClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900";

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  value,
  onChange,
  className = "",
  optionsLabel = "View mode",
}) => {
  return (
    <div
      className={`inline-flex items-center rounded-lg border border-gray-200/90 bg-white/90 p-1 shadow-sm dark:border-gray-700/80 dark:bg-gray-800/90 ${className}`}
      role="group"
      aria-label={optionsLabel}
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`${buttonBaseClassName} ${
          value === "list"
            ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
        }`}
        aria-label="List view"
        aria-pressed={value === "list"}
        title="List view"
      >
        <List className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`${buttonBaseClassName} ${
          value === "grid"
            ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
        }`}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        title="Grid view"
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ViewModeToggle;
