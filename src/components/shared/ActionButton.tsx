import React from "react";
import { LucideIcon } from "lucide-react";
import Button from "./Button";
import { logger } from "../../lib/logger";

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
 * @deprecated ActionButton is deprecated. Use <Button variant="action" size="icon" icon={...} /> directly instead.
 *
 * This component now wraps the modern Button component for backwards compatibility.
 *
 * Migration guide:
 * - variant="success" → <Button variant="subtle" size="icon" /> with custom colors
 * - variant="danger" → <Button variant="danger" size="icon" />
 * - variant="comment" → <Button variant="action" size="icon" />
 * - variant="default" → <Button variant="subtle" size="icon" />
 * - isActive prop → Use variant="primary" or custom styling
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
  // Log deprecation warning in development
  if (process.env.NODE_ENV === "development") {
    logger.warn(
      'ActionButton is deprecated. Use <Button variant="action" size="icon" icon={...} /> instead.'
    );
  }

  // Map old variants to new Button variants
  const getButtonVariant = ():
    | "primary"
    | "secondary"
    | "subtle"
    | "danger"
    | "action" => {
    if (isActive) {
      // Active state uses primary variant
      return "primary";
    }

    switch (variant) {
      case "danger":
        return "danger";
      case "comment":
        return "action";
      case "success":
      case "default":
      default:
        return "subtle";
    }
  };

  // Custom className overrides for success variant (green hover)
  const customClassName =
    variant === "success" && !isActive
      ? "hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
      : "";

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={getButtonVariant()}
      size="icon"
      icon={<Icon className="w-4 h-4" />}
      title={title}
      className={`${customClassName} ${className}`}
      aria-label={title}
    />
  );
};

export default ActionButton;
