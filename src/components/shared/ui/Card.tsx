import React, { ElementType } from "react";

type CardVariant = "default" | "elevated" | "interactive" | "glass";
type CardHover = "none" | "lift" | "border" | "glow";
type CardShadow = "none" | "sm" | "md" | "lg";
type CardSpacing = "none" | "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  hover?: CardHover;
  border?: boolean;
  shadow?: CardShadow;
  spacing?: CardSpacing;
  clickable?: boolean;
  as?: ElementType;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  tabIndex?: number;
  role?: string;
  "aria-label"?: string;
}

const spacingMap: Record<CardSpacing, string> = {
  none: "",
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
};

const shadowMap: Record<CardShadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  hover = "none",
  border = true,
  shadow = "sm",
  spacing = "md",
  clickable = false,
  as: Component = "div",
  onClick,
  onKeyDown,
  tabIndex,
  role,
  "aria-label": ariaLabel,
}) => {
  const baseClasses =
    "bg-white dark:bg-gray-800 rounded-lg transition-all duration-200";

  const variantClasses = {
    default: "",
    elevated: "shadow-md hover:shadow-lg",
    interactive: "hover:shadow-md",
    glass: "backdrop-blur-sm bg-white/80 dark:bg-gray-800/80",
  };

  const borderClasses = border
    ? "border border-gray-200 dark:border-gray-700"
    : "";

  const hoverClasses = {
    none: "",
    lift: "hover:-translate-y-0.5 hover:border-primary",
    border: "hover:border-primary",
    glow: "hover:shadow-primary/10 hover:border-primary",
  };

  const clickableClasses =
    clickable || onClick
      ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      : "";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
    onKeyDown?.(e);
  };

  return (
    <Component
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable || onClick ? tabIndex ?? 0 : tabIndex}
      role={role || (clickable || onClick ? "button" : undefined)}
      aria-label={ariaLabel}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${borderClasses}
        ${shadowMap[shadow]}
        ${spacingMap[spacing]}
        ${hoverClasses[hover]}
        ${clickableClasses}
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </Component>
  );
};

export default Card;
