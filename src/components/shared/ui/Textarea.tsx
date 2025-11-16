import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
  containerClassName?: string;
  textareaClassName?: string;
}

/**
 * Accessible Textarea component with proper ARIA labels and error handling
 *
 * WCAG Compliance:
 * - 1.3.1: Info and Relationships (Level A) - Proper label association
 * - 4.1.2: Name, Role, Value (Level A) - ARIA attributes for states
 * - 3.3.1: Error Identification (Level A) - Clear error messages
 * - 3.3.2: Labels or Instructions (Level A) - Helper text support
 *
 * @example
 * <Textarea
 *   id="bio"
 *   label="Bio"
 *   error={errors.bio}
 *   helperText="Tell us about yourself (max 500 characters)"
 *   maxLength={500}
 *   rows={4}
 *   required
 * />
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      resize = "vertical",
      required,
      disabled,
      maxLength,
      containerClassName = "",
      textareaClassName = "",
      ...props
    },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;
    const ariaDescribedBy = [errorId, helperId].filter(Boolean).join(" ");

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

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

        {/* Textarea Container */}
        <div className="relative">
          {/* Textarea Field */}
          <textarea
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={ariaDescribedBy || undefined}
            aria-required={required ? "true" : undefined}
            className={`
              block w-full rounded-lg border transition-colors
              px-3 py-2.5
              bg-white dark:bg-gray-700/50
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
              ${resizeClasses[resize]}
              ${
                error
                  ? "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-primary"
              }
              ${textareaClassName}
            `}
            {...props}
          />

          {/* Error Icon (positioned at top-right) */}
          {error && (
            <div className="absolute right-3 top-3 text-red-500 dark:text-red-400 pointer-events-none">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Character Count */}
        {maxLength && !error && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {props.value
              ? `${String(props.value).length}/${maxLength}`
              : `0/${maxLength}`}
          </div>
        )}

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

Textarea.displayName = "Textarea";

export default Textarea;
