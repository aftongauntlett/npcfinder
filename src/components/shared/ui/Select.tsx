import React, { forwardRef, SelectHTMLAttributes } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  selectClassName?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "py-1.5 text-sm",
  md: "py-2.5 text-base",
  lg: "py-3 text-lg",
};

/**
 * Accessible Select component with proper ARIA labels and error handling
 * Follows the same design pattern as Input and Textarea for consistency
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      leftIcon,
      required,
      disabled,
      containerClassName = "",
      selectClassName = "",
      placeholder,
      options = [],
      size = "md",
      children,
      ...props
    },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;
    const ariaDescribedBy = [errorId, helperId].filter(Boolean).join(" ");

    return (
      <div className={containerClassName}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && (
              <span
                className="text-red-500 dark:text-red-400 ml-1"
                aria-label="required"
              >
                *
              </span>
            )}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}

          {/* Select Field */}
          <select
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={ariaDescribedBy || undefined}
            aria-required={required ? "true" : undefined}
            className={`
              block w-full rounded-lg border transition-colors appearance-none
              ${leftIcon ? "pl-10" : "pl-3"}
              pr-10
              ${sizeClasses[size]}
              bg-white dark:bg-gray-700/50
              text-gray-900 dark:text-white
              ${
                error
                  ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary/20"
              }
              ${
                disabled
                  ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "hover:border-gray-400 dark:hover:border-gray-500"
              }
              focus:outline-none focus:ring-2
              ${selectClassName}
            `
              .trim()
              .replace(/\s+/g, " ")}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            {children}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <ChevronDown className="w-5 h-5" />
          </div>

          {/* Error Icon */}
          {error && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400 pointer-events-none">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
