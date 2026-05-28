import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

interface ThemedDatePickerProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (nextValue: string) => void;
  helperText?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  allowClear?: boolean;
  ariaLabel?: string;
}

function parseDateValue(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isOutOfRange(
  day: Date,
  minDate: Date | null,
  maxDate: Date | null,
): boolean {
  if (minDate && isBefore(day, minDate)) {
    return true;
  }

  if (maxDate && isAfter(day, maxDate)) {
    return true;
  }

  return false;
}

export default function ThemedDatePicker({
  id,
  label,
  value,
  onChange,
  helperText,
  placeholder = "Select date",
  className = "",
  disabled = false,
  minDate,
  maxDate,
  allowClear = true,
  ariaLabel,
}: ThemedDatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const minDateValue = useMemo(() => parseDateValue(minDate), [minDate]);
  const maxDateValue = useMemo(() => parseDateValue(maxDate), [maxDate]);

  const [viewMonth, setViewMonth] = useState<Date>(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setViewMonth(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onDocumentMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    document.addEventListener("keydown", onDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [isOpen]);

  const monthStart = startOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(endOfMonth(viewMonth));

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd],
  );

  const handleSelectDay = (day: Date) => {
    if (disabled || isOutOfRange(day, minDateValue, maxDateValue)) {
      return;
    }

    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          {label}
        </label>
      )}

      <div ref={rootRef} className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={ariaLabel || label || "Choose date"}
          className="h-10 w-full rounded-xl border border-gray-200/90 dark:border-gray-600/80 bg-white/90 dark:bg-gray-700/60 px-3 text-sm text-gray-900 dark:text-white shadow-sm backdrop-blur-sm transition-colors hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:focus-visible:ring-primary-light/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-left">
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : placeholder}
            </span>
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-300" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute left-0 z-50 mt-2 w-[280px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 p-3 shadow-xl backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {format(viewMonth, "MMMM yyyy")}
              </div>

              <button
                type="button"
                onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {weekdayLabels.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dayDisabled = isOutOfRange(
                  day,
                  minDateValue,
                  maxDateValue,
                );
                const daySelected = selectedDate
                  ? isSameDay(day, selectedDate)
                  : false;
                const outsideMonth = !isSameMonth(day, viewMonth);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    disabled={dayDisabled}
                    className={`h-8 rounded-lg text-sm transition-colors ${
                      daySelected
                        ? "bg-primary text-white"
                        : outsideMonth
                          ? "text-gray-400 dark:text-gray-500 hover:bg-gray-100/60 dark:hover:bg-gray-700/40"
                          : isToday(day)
                            ? "text-primary dark:text-primary-light bg-primary/10 dark:bg-primary/20 hover:bg-primary/15"
                            : "text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${dayDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                    aria-label={format(day, "MMMM d, yyyy")}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-200/80 dark:border-gray-700/80 pt-3">
              {allowClear ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  handleSelectDay(today);
                }}
                className="text-xs font-medium text-primary hover:opacity-80"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
