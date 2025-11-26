/**
 * Empty State Component
 * Reusable component for empty/placeholder states with dashed borders
 */

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  const isClickable = !!onAction;

  return (
    <div
      className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-all ${
        isClickable
          ? "cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          : ""
      } ${className}`}
      onClick={onAction}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAction?.();
              }
            }
          : undefined
      }
    >
      <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
        {Icon && (
          <Icon
            className={`w-12 h-12 ${
              isClickable
                ? "text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          />
        )}
        {title && (
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {title}
          </p>
        )}
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {description}
          </p>
        )}
        {actionLabel && isClickable && (
          <span className="text-sm text-purple-600 dark:text-purple-300 font-medium mt-2">
            {actionLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
