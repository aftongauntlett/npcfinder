import React from "react";
import { X } from "lucide-react";

type ChipVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
type ChipSize = "sm" | "md" | "lg";
type ChipRounded = "default" | "full";

interface ChipProps {
  children: React.ReactNode;
  variant?: ChipVariant;
  size?: ChipSize;
  rounded?: ChipRounded;
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<ChipVariant, string> = {
  default:
    "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
  primary: "bg-primary/10 text-primary border-primary/20",
  success:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  warning:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  danger:
    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
};

const sizeClasses: Record<
  ChipSize,
  { base: string; icon: string; removeButton: string }
> = {
  sm: {
    base: "text-xs px-2 py-0.5",
    icon: "w-3 h-3",
    removeButton: "w-3 h-3 ml-1",
  },
  md: {
    base: "text-sm px-2.5 py-1",
    icon: "w-4 h-4",
    removeButton: "w-4 h-4 ml-1.5",
  },
  lg: {
    base: "text-base px-3 py-1.5",
    icon: "w-5 h-5",
    removeButton: "w-5 h-5 ml-2",
  },
};

const Chip: React.FC<ChipProps> = ({
  children,
  variant = "default",
  size = "md",
  rounded = "default",
  removable = false,
  onRemove,
  icon,
  className = "",
  onClick,
}) => {
  const baseClasses =
    "inline-flex items-center font-medium border transition-colors";
  const roundedClasses = rounded === "full" ? "rounded-full" : "rounded-md";
  const clickableClasses = onClick ? "cursor-pointer hover:opacity-80" : "";

  return (
    <span
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size].base}
        ${roundedClasses}
        ${clickableClasses}
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {icon && (
        <span className={`${sizeClasses[size].icon} mr-1 flex-shrink-0`}>
          {icon}
        </span>
      )}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`${sizeClasses[size].removeButton} flex-shrink-0 hover:opacity-70 transition-opacity`}
          aria-label="Remove"
        >
          <X className="w-full h-full" />
        </button>
      )}
    </span>
  );
};

export default Chip;
