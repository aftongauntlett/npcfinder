import React from "react";

/**
 * Button Variants:
 * - primary: Solid fill with theme color
 * - secondary: Outlined style with border
 * - subtle: Minimal ghost style with light background
 */
export type ButtonVariant = "primary" | "secondary" | "subtle";

export type ButtonSize = "sm" | "md" | "lg";

export type IconPosition = "left" | "right";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Modern Button Component
 *
 * Clean, accessible button with consistent styling. Supports dynamic
 * user theme colors with fallback contrast handling.
 *
 * Usage Rules:
 * - Use this component for ALL buttons (except landing page)
 * - In dialogs/forms: Cancel left, Save/OK right, container right-aligned
 * - Icon-only buttons MUST have aria-label
 * - No scale/grow hover effects - subtle opacity only
 *
 * @example
 * <Button variant="primary">Save</Button>
 * <Button variant="secondary" icon={<Plus />}>Add</Button>
 * <Button loading>Processing...</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const isIconOnly = !children && !!icon;

    // Accessibility check
    if (isIconOnly && !ariaLabel && !props["aria-labelledby"]) {
      console.warn(
        "Button: Icon-only buttons require aria-label for accessibility"
      );
    }

    // Build class names
    const classes = [
      // Base layout
      "inline-flex items-center justify-center gap-2",
      "font-medium",
      // Border - squared corners per requirements
      "rounded border-2",
      // Smooth transitions - no scale
      "transition-colors duration-200",
      // Focus state - visible ring for accessibility
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      // Disabled state
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      // Full width
      fullWidth && "w-full",
    ];

    // Variant styles
    const variantStyles: Record<ButtonVariant, string[]> = {
      primary: [
        "border-current bg-current text-white",
        "hover:opacity-90",
        "focus-visible:ring-current",
      ],
      secondary: [
        "border-current bg-transparent text-current",
        "hover:bg-current/10",
        "focus-visible:ring-current",
      ],
      subtle: [
        "border-border/50 bg-surface/30 text-text-primary",
        "hover:bg-surface/50 hover:border-border",
        "focus-visible:ring-primary",
      ],
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      sm: isIconOnly ? "p-1.5" : "px-3 py-1.5 text-sm",
      md: isIconOnly ? "p-2" : "px-4 py-2 text-sm",
      lg: isIconOnly ? "p-3" : "px-6 py-3 text-base",
    };

    // Icon size
    const iconSize: Record<ButtonSize, string> = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    // Loading spinner
    const Spinner = () => (
      <svg
        className={`animate-spin ${iconSize[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Theme color inline styles for primary/secondary
    const getThemeStyles = (): React.CSSProperties | undefined => {
      if (variant === "primary" || variant === "secondary") {
        return {
          color: variant === "primary" ? "white" : "var(--color-primary)",
          borderColor: "var(--color-primary)",
          backgroundColor:
            variant === "primary" ? "var(--color-primary)" : undefined,
        };
      }
      return undefined;
    };

    const combinedClasses = [
      ...classes,
      ...variantStyles[variant],
      sizeStyles[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        aria-label={ariaLabel}
        className={combinedClasses}
        style={getThemeStyles()}
        {...props}
      >
        {loading && <Spinner />}

        {!loading && icon && iconPosition === "left" && (
          <span className="flex-shrink-0 inline-flex items-center justify-center">
            {icon}
          </span>
        )}

        {children && <span>{children}</span>}

        {!loading && icon && iconPosition === "right" && (
          <span className="flex-shrink-0 inline-flex items-center justify-center">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
