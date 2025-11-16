import React from "react";
import { LucideIcon } from "lucide-react";
import Button from "./Button";
import { logger } from "../../../lib/logger";

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "danger" | "primary" | "active";
  title?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * @deprecated IconButton is deprecated. Use <Button size="icon" icon={...} /> directly instead.
 *
 * This component now wraps the modern Button component for backwards compatibility.
 *
 * Migration guide:
 * - variant="default" → <Button variant="subtle" size="icon" />
 * - variant="success" → <Button variant="subtle" size="icon" /> (custom hover via onMouseEnter)
 * - variant="warning" → <Button variant="subtle" size="icon" /> (custom hover via onMouseEnter)
 * - variant="danger" → <Button variant="danger" size="icon" />
 * - variant="primary" → <Button variant="primary" size="icon" />
 * - variant="active" → <Button variant="primary" size="icon" />
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  variant = "default",
  title,
  disabled = false,
  className = "",
}) => {
  // Log deprecation warning in development
  if (process.env.NODE_ENV === "development") {
    logger.warn(
      'IconButton is deprecated. Use <Button size="icon" icon={...} /> instead.'
    );

    // Warn if title is missing for accessibility
    if (!title && !disabled) {
      logger.warn(
        'IconButton: "title" prop is required for accessibility. Provide a descriptive label for icon-only controls.'
      );
    }
  }

  // Map old variants to new Button variants
  const getButtonVariant = ():
    | "primary"
    | "secondary"
    | "subtle"
    | "danger"
    | "action" => {
    switch (variant) {
      case "danger":
        return "danger";
      case "primary":
      case "active":
        return "primary";
      case "default":
      case "success":
      case "warning":
      default:
        return "subtle";
    }
  };

  // Handle custom hover colors for success/warning variants
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (variant === "success") {
      e.currentTarget.style.backgroundColor = "rgb(22 163 74)"; // green-600
      e.currentTarget.style.color = "white";
    } else if (variant === "warning") {
      e.currentTarget.style.backgroundColor = "rgb(234 88 12)"; // orange-600
      e.currentTarget.style.color = "white";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (variant === "success" || variant === "warning") {
      e.currentTarget.style.backgroundColor = "";
      e.currentTarget.style.color = "";
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={getButtonVariant()}
      size="icon"
      icon={<Icon className="w-4 h-4" />}
      title={title}
      aria-label={title}
      className={className}
      onMouseEnter={
        variant === "success" || variant === "warning"
          ? handleMouseEnter
          : undefined
      }
      onMouseLeave={
        variant === "success" || variant === "warning"
          ? handleMouseLeave
          : undefined
      }
    />
  );
};

export default IconButton;
