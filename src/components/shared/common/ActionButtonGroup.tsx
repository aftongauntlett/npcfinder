import React from "react";
import Button from "../ui/Button";
import Tooltip from "../ui/Tooltip";

export interface ActionConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
  tooltip?: string;
}

/**
 * ActionButtonGroup - Renders a group of icon-only action buttons
 *
 * This component standardizes icon-only action buttons (edit, delete, etc.)
 * across cards, lists, and other UI components. All buttons use size="icon"
 * from the Button component for consistent icon-only styling.
 *
 * Note: This component does not expose a `size` prop because it only renders
 * icon-only buttons at a fixed size. If you need different button sizes with
 * text labels, use the Button component directly.
 */
interface ActionButtonGroupProps {
  actions: ActionConfig[];
  orientation?: "horizontal" | "vertical";
  spacing?: "tight" | "normal" | "loose";
  className?: string;
}

/**
 * Maps ActionConfig variants to Button component variants
 */
const getButtonVariant = (
  variant: ActionConfig["variant"]
): "subtle" | "danger" => {
  if (variant === "danger") return "danger";
  return "subtle";
};

/**
 * Returns custom className for success/warning variants
 * that need special color treatment beyond Button component defaults
 */
const getCustomClassName = (variant: ActionConfig["variant"]): string => {
  if (variant === "success") {
    return "hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20";
  }
  if (variant === "warning") {
    return "hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20";
  }
  return "";
};

export default function ActionButtonGroup({
  actions,
  orientation = "horizontal",
  spacing = "normal",
  className = "",
}: ActionButtonGroupProps) {
  const spacingClasses = {
    tight: "gap-1",
    normal: "gap-2",
    loose: "gap-3",
  };

  const containerClass =
    orientation === "horizontal" ? "flex" : "flex flex-col";

  return (
    <div
      className={`${containerClass} ${spacingClasses[spacing]} ${className}`}
    >
      {actions.map((action) => {
        const customClass = getCustomClassName(action.variant);

        const button = (
          <Button
            key={action.id}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            disabled={action.disabled}
            variant={getButtonVariant(action.variant)}
            size="icon"
            icon={action.icon}
            aria-label={action.label}
            className={customClass}
          />
        );

        if (!action.tooltip) {
          return button;
        }

        return (
          <Tooltip key={action.id} content={action.tooltip} position="bottom">
            {button}
          </Tooltip>
        );
      })}
    </div>
  );
}
