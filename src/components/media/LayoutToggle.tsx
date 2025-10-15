import React from "react";
import { LayoutGrid, List } from "lucide-react";

interface LayoutToggleProps {
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
}

/**
 * LayoutToggle - Switch between grid and list views
 */
const LayoutToggle: React.FC<LayoutToggleProps> = ({
  layout,
  onLayoutChange,
}) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onLayoutChange("grid")}
        className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
          layout === "grid"
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Grid</span>
      </button>
      <button
        onClick={() => onLayoutChange("list")}
        className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
          layout === "list"
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        title="List view"
      >
        <List className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">List</span>
      </button>
    </div>
  );
};

export default LayoutToggle;
