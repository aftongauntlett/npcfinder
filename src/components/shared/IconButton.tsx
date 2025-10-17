import React from "react";
import { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "danger" | "primary" | "active";
  title?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable IconButton Component
 * Consistent styling across all card actions
 *
 * Variants:
 * - default: Gray background, gray-600 hover
 * - success: Gray background, green-600 hover (Hit/Like)
 * - warning: Gray background, orange-600 hover (Miss/Thumbs Down)
 * - danger: Gray background, red-600 hover (Delete/Trash)
 * - primary: Gray background, theme color hover (Comment)
 * - active: Theme color background, white text (Active state)
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  variant = "default",
  title,
  disabled = false,
  className = "",
}) => {
  const baseStyles =
    "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    default:
      "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
    success: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    warning: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    danger: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    primary: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    active: "text-white", // Will use inline style for backgroundColor
  };

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (variant === "primary") {
      e.currentTarget.style.backgroundColor = "var(--color-primary)";
    } else if (variant === "success") {
      e.currentTarget.style.backgroundColor = "rgb(22 163 74)"; // green-600
      e.currentTarget.style.color = "white";
    } else if (variant === "warning") {
      e.currentTarget.style.backgroundColor = "rgb(234 88 12)"; // orange-600
      e.currentTarget.style.color = "white";
    } else if (variant === "danger") {
      e.currentTarget.style.backgroundColor = "rgb(220 38 38)"; // red-600
      e.currentTarget.style.color = "white";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (variant === "primary") {
      e.currentTarget.style.backgroundColor = "";
    } else if (
      variant === "success" ||
      variant === "warning" ||
      variant === "danger"
    ) {
      e.currentTarget.style.backgroundColor = "";
      e.currentTarget.style.color = "";
    }
  };

  // For active state, use inline style for background color
  const inlineStyle =
    variant === "active"
      ? { backgroundColor: "var(--color-primary)" }
      : undefined;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={inlineStyle}
      title={title}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

export default IconButton;
