import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

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
    "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300",
  danger:
    "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400",
  success:
    "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400",
  warning:
    "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400",
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
          <motion.button
            key={action.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            disabled={action.disabled}
            title={action.tooltip || action.label}
            aria-label={action.label}
            className={`${sizeClasses[size]} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]}`}
            whileHover={{ scale: action.disabled ? 1 : 1.05 }}
            whileTap={{ scale: action.disabled ? 1 : 0.95 }}
          >
            {action.icon}
          </motion.button>
        );
      })}
    </div>
  );
}
