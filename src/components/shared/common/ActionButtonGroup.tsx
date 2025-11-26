import React from "react";

export interface ActionConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
  tooltip?: string;
}

interface ActionButtonGroupProps {
  actions: ActionConfig[];
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md";
  spacing?: "tight" | "normal" | "loose";
  className?: string;
}

const variantClasses = {
  default:
    "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
  danger:
    "text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
  success:
    "text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
  warning:
    "text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
};

export default function ActionButtonGroup({
  actions,
  orientation = "horizontal",
  size = "md",
  spacing = "normal",
  className = "",
}: ActionButtonGroupProps) {
  const spacingClasses = {
    tight: "gap-1",
    normal: "gap-2",
    loose: "gap-3",
  };

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
  };

  const containerClass =
    orientation === "horizontal" ? "flex" : "flex flex-col";

  return (
    <div
      className={`${containerClass} ${spacingClasses[spacing]} ${className}`}
    >
      {actions.map((action) => {
        const variant = action.variant || "default";

        return (
          <button
            key={action.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            disabled={action.disabled}
            title={action.tooltip || action.label}
            aria-label={action.label}
            className={`${sizeClasses[size]} rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]}`}
          >
            {action.icon}
          </button>
        );
      })}
    </div>
  );
}
