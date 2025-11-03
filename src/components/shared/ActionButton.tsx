import React from "react";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: "success" | "danger" | "comment" | "default";
  isActive?: boolean; // For showing active state (hit/miss already selected)
  title?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * ActionButton Component
 * Matches the watchlist action button design with proper hover effects
 *
 * Variants:
 * - success: Green (hit/like actions)
 * - danger: Red (miss/delete actions)
 * - comment: Blue (comment/edit actions)
 * - default: Gray (neutral actions)
 *
 * When isActive=true, shows the colored state
 * When isActive=false, shows gray with colored hover effect
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  onClick,
  variant = "default",
  isActive = false,
  title,
  disabled = false,
  className = "",
}) => {
  const baseStyles =
    "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800";

  // Variant styles using CSS utility classes that match watchlist buttons
  const getVariantClass = () => {
    if (isActive) {
      // Active state: show colored background
      if (variant === "success") return "btn-success-light";
      if (variant === "danger") return "btn-danger-light";
      if (variant === "comment") return "btn-recommend-light";
      return "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300";
    } else {
      // Inactive state: gray background with colored hover
      return "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";
    }
  };

  const variantClass = getVariantClass();

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${variantClass} ${className}`}
      title={title}
      aria-label={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

export default ActionButton;
