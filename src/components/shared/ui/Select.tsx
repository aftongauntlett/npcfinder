import React, {
  forwardRef,
  SelectHTMLAttributes,
  useState,
  useRef,
  useEffect,
} from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
};

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  selectClassName?: string;
  placeholder?: string;
  options?: SelectOption[];
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "py-1.5 px-3 text-sm",
  md: "py-2 px-4 text-base",
  lg: "py-2.5 px-5 text-lg",
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
      value,
      onChange,
      children,
      ...props
    },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;
    const ariaDescribedBy = [errorId, helperId].filter(Boolean).join(" ");

    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !triggerRef.current?.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex].value);
          }
          break;
      }
    };

    const handleSelect = (optionValue: string) => {
      if (onChange && hiddenSelectRef.current) {
        // Create a synthetic event
        const syntheticEvent = {
          target: { value: optionValue },
          currentTarget: { value: optionValue },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      setIsOpen(false);
    };

    const selectedOption = options.find((opt) => opt.value === value);
    const displayValue = selectedOption?.label || placeholder || "Select...";

    return (
      <div className={containerClassName}>
        {/* Hidden native select for form compatibility */}
        <select
          ref={(node) => {
            hiddenSelectRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
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

        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-bold text-primary mb-1"
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

        {/* Custom Select Trigger */}
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={ariaDescribedBy || undefined}
            aria-required={required ? "true" : undefined}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`
              block w-full rounded-lg border transition-colors text-left
              ${leftIcon ? "pl-10 pr-10" : "pr-10"}
              ${sizeClasses[size]}
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              ${
                error
                  ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary/20"
              }
              ${
                disabled
                  ? "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50"
                  : "hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer"
              }
              focus:outline-none focus:ring-2
              ${selectClassName}
            `
              .trim()
              .replace(/\s+/g, " ")}
          >
            {displayValue}
          </button>

          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}

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

          {/* Dropdown Menu */}
          {isOpen && !disabled && (
            <div
              ref={dropdownRef}
              className="absolute z-dropdown mt-2 w-full min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-auto"
              role="listbox"
            >
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  disabled={option.disabled}
                  className={
                    `
                    w-full flex items-center justify-between gap-3
                    ${sizeClasses[size]}
                    text-left transition-colors
                    ${
                      option.disabled
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                    ${
                      focusedIndex === index
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                    ${value === option.value ? "bg-primary/5" : ""}
                    ${index === 0 ? "rounded-t-lg" : ""}
                    ${index === options.length - 1 ? "rounded-b-lg" : ""}
                  `
                      .trim()
                      .replace(/\s+/g, " ")
                  }
                  role="option"
                  aria-selected={value === option.value}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {option.leftIcon ? (
                      <span className="flex-shrink-0" aria-hidden="true">
                        {option.leftIcon}
                      </span>
                    ) : null}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {value === option.value && (
                    <Check
                      className="w-4 h-4 text-primary flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
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
