import React from "react";
import { logger } from "../../../lib/logger";

/**
 * Button Variants:
 * - primary: Solid fill with theme color and glassmorphism effects
 * - secondary: Outlined style with glass effect, fills on hover
 * - subtle: Minimal ghost style with light background
 * - danger: Pastel red for destructive actions (delete, remove, etc.)
 * - action: Prominent glass button for high-frequency actions (Add, Create, etc.)
 */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "danger"
  | "action";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

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
    const isIconSize = size === "icon";
    const shouldUseIconStyling = isIconOnly || isIconSize;

    // Accessibility check
    if (isIconOnly && !ariaLabel && !props["aria-labelledby"]) {
      logger.warn(
        "Button: Icon-only buttons require aria-label for accessibility"
      );
    }

    // Accessibility check for mobile-hidden text
    if (hideTextOnMobile && !ariaLabel && !props["aria-labelledby"]) {
      logger.warn(
        "Button: Buttons with hideTextOnMobile require aria-label for accessibility"
      );
    }

    // Build class names
    const classes = [
      // Base layout - responsive gap
      "inline-flex items-center justify-center",
      hideTextOnMobile ? "gap-0 sm:gap-2" : "gap-2", // No gap on mobile when text is hidden
      "font-medium",
      // Border and corners - minimal borders for modern look
      variant === "action" ? "rounded-lg border-0" : "rounded-lg",
      // Smooth transitions
      "transition-all duration-300 ease-out",
      // Focus state - visible ring for accessibility
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      // Disabled state
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      // Full width
      fullWidth && "w-full",
    ];

    // Variant styles with glassmorphism effects
    const variantStyles: Record<ButtonVariant, string[]> = {
      primary: [
        "bg-current text-white shadow-sm",
        "glass-button hover-sheen",
        "hover:opacity-90 hover:shadow-md hover:[backdrop-filter:blur(10px)_saturate(130%)]",
        "focus-visible:ring-current",
      ],
      secondary: [
        "border border-current bg-transparent text-current shadow-sm",
        "glass-button",
        "hover:shadow-md",
        "hover:[background:color-mix(in_srgb,var(--color-primary)_12%,transparent)]",
        "hover:[backdrop-filter:blur(8px)_saturate(120%)]",
        "focus-visible:ring-current",
      ],
      subtle: [
        "border-transparent bg-gray-50/50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300",
        "backdrop-blur-sm",
        "hover:bg-gray-100/70 dark:hover:bg-gray-700/40 hover:shadow-sm",
        "focus-visible:ring-primary",
      ],
      danger: [
        "border border-red-200 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400",
        "backdrop-blur-sm",
        "hover:bg-red-100/90 dark:hover:bg-red-950/60 hover:border-red-300 dark:hover:border-red-700/60 hover:shadow-sm",
        "focus-visible:ring-red-500 dark:focus-visible:ring-red-400",
      ],
      action: [
        "border-2 border-primary/40 bg-primary/5 dark:bg-primary-light/5 text-primary dark:text-primary-light shadow-md",
        "glass-button hover-sheen hover-glow",
        "hover:border-primary/60 dark:hover:border-primary-light/60 hover:shadow-lg",
        "hover:bg-primary/15 dark:hover:bg-primary-light/15",
        "hover:[backdrop-filter:blur(12px)_saturate(130%)]",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      ],
    };

    // Size styles - with responsive padding for hideTextOnMobile
    const getSizeStyles = (): string => {
      if (shouldUseIconStyling) {
        const iconOnlySizes: Record<ButtonSize, string> = {
          sm: "p-1.5",
          md: "p-2",
          lg: "p-3",
          icon: "p-2", // Square icon button
        };
        return iconOnlySizes[size];
      }

      if (hideTextOnMobile) {
        // On mobile (icon-only), use icon-only padding; on desktop, use normal padding
        const responsiveSizes: Record<ButtonSize, string> = {
          sm: "p-1.5 sm:px-3 sm:py-1.5 text-sm",
          md: "p-2 sm:px-4 sm:py-2 text-sm",
          lg: "p-3 sm:px-6 sm:py-3 text-base",
          icon: "p-2", // Icon size doesn't change
        };
        return responsiveSizes[size];
      }

      // Normal buttons with text
      const normalSizes: Record<ButtonSize, string> = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        icon: "p-2", // Fallback
      };
      return normalSizes[size];
    };

    // Icon size
    const iconSize: Record<ButtonSize, string> = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
      icon: "w-4 h-4",
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

    // Theme color inline styles for primary/secondary/action
    const getThemeStyles = (): React.CSSProperties | undefined => {
      if (variant === "primary" || variant === "secondary") {
        return {
          color:
            variant === "primary"
              ? "var(--color-text-on-primary)"
              : "var(--color-primary)",
          backgroundColor:
            variant === "primary" ? "var(--color-primary)" : undefined,
          borderColor: "var(--color-primary)",
          ["--hover-text-color" as string]: "var(--color-text-on-primary)",
        } as React.CSSProperties;
      }
      if (variant === "action") {
        return {
          borderColor: "var(--color-primary)",
          color: "var(--color-primary)",
          ["--hover-bg" as string]: "var(--color-primary)",
          ["--hover-text" as string]: "var(--color-text-on-primary)",
        } as React.CSSProperties;
      }
      return undefined;
    };

    const combinedClasses = [
      "group", // Add group class for icon hover effects
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

        {!loading &&
          icon &&
          iconPosition === "left" &&
          (shouldUseIconStyling ? (
            <span className="inline-flex">{icon}</span>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center justify-center">
              {icon}
            </span>
          ))}

        {children && (
          <span className={hideTextOnMobile ? "hidden sm:inline" : ""}>
            {children}
          </span>
        )}

        {!loading &&
          icon &&
          iconPosition === "right" &&
          (shouldUseIconStyling ? (
            <span className="inline-flex">{icon}</span>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center justify-center">
              {icon}
            </span>
          ))}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
