import React from "react";

/**
 * Button Variants:
 * - primary: Solid fill with theme color
 * - secondary: Outlined style with border
 * - subtle: Minimal ghost style with light background
 * - danger: Pastel red for destructive actions (delete, remove, etc.)
 */
export type ButtonVariant = "primary" | "secondary" | "subtle" | "danger";

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
  hideTextOnMobile?: boolean; // Show only icon on mobile screens
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
      hideTextOnMobile = false,
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

    // Accessibility check for mobile-hidden text
    if (hideTextOnMobile && !ariaLabel && !props["aria-labelledby"]) {
      console.warn(
        "Button: Buttons with hideTextOnMobile require aria-label for accessibility"
      );
    }

    // Build class names
    const classes = [
      // Base layout - responsive gap
      "inline-flex items-center justify-center",
      hideTextOnMobile ? "gap-0 sm:gap-2" : "gap-2", // No gap on mobile when text is hidden
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
      danger: [
        "border-red-300 dark:border-red-400/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400",
        "hover:bg-red-100 dark:hover:bg-red-950/50 hover:border-red-400 dark:hover:border-red-400/70",
        "focus-visible:ring-red-500 dark:focus-visible:ring-red-400",
      ],
    };

    // Size styles - with responsive padding for hideTextOnMobile
    const getSizeStyles = (): string => {
      if (isIconOnly) {
        const iconOnlySizes: Record<ButtonSize, string> = {
          sm: "p-1.5",
          md: "p-2",
          lg: "p-3",
        };
        return iconOnlySizes[size];
      }

      if (hideTextOnMobile) {
        // On mobile (icon-only), use icon-only padding; on desktop, use normal padding
        const responsiveSizes: Record<ButtonSize, string> = {
          sm: "p-1.5 sm:px-3 sm:py-1.5 text-sm",
          md: "p-2 sm:px-4 sm:py-2 text-sm",
          lg: "p-3 sm:px-6 sm:py-3 text-base",
        };
        return responsiveSizes[size];
      }

      // Normal buttons with text
      const normalSizes: Record<ButtonSize, string> = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      };
      return normalSizes[size];
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
      getSizeStyles(),
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

        {children && (
          <span className={hideTextOnMobile ? "hidden sm:inline" : ""}>
            {children}
          </span>
        )}

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
