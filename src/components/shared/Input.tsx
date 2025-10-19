import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

/**
 * Accessible Input component with proper ARIA labels and error handling
 *
 * WCAG Compliance:
 * - 1.3.1: Info and Relationships (Level A) - Proper label association
 * - 4.1.2: Name, Role, Value (Level A) - ARIA attributes for states
 * - 3.3.1: Error Identification (Level A) - Clear error messages
 * - 3.3.2: Labels or Instructions (Level A) - Helper text support
 *
 * @example
 * <Input
 *   id="email"
 *   label="Email"
 *   type="email"
 *   error={errors.email}
 *   helperText="We'll never share your email"
 *   required
 * />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required,
      disabled,
      containerClassName = "",
      inputClassName = "",
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

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={ariaDescribedBy || undefined}
            aria-required={required ? "true" : undefined}
            className={`
              block w-full rounded-lg border transition-colors
              ${leftIcon ? "pl-10" : "pl-3"}
              ${rightIcon || error ? "pr-10" : "pr-3"}
              py-2.5
              bg-white dark:bg-gray-700/50
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                error
                  ? "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              }
              ${inputClassName}
            `}
            {...props}
          />

          {/* Right Icon or Error Icon */}
          {error ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400 pointer-events-none">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
            </div>
          ) : (
            rightIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {rightIcon}
              </div>
            )
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

Input.displayName = "Input";

export default Input;
