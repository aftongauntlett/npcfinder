import { useMemo } from "react";
import DatePicker from "react-datepicker";
import Select from "@/components/shared/ui/Select";

const TIMER_MINUTE_OPTIONS = Array.from({ length: 59 }, (_, i) => {
  const value = String(i + 1);
  return { value, label: value };
});

const TIMER_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i + 1);
  return { value, label: value };
});

const TIMER_SECOND_OPTIONS = Array.from({ length: 59 }, (_, i) => {
  const value = String(i + 1);
  return { value, label: value };
});

type RepeatFrequency = "daily" | "weekly" | "monthly" | "yearly";

type TimerUnit = "minutes" | "hours" | "seconds";

interface TaskSchedulingControlsProps {
  themeColor: string;

  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;

  isRepeatable: boolean;
  setIsRepeatable: (value: boolean) => void;
  repeatFrequency: RepeatFrequency;
  setRepeatFrequency: (value: RepeatFrequency) => void;
  repeatInterval: number;
  setRepeatInterval: (value: number) => void;

  hasTimer: boolean;
  setHasTimer: (value: boolean) => void;
  timerDuration: number;
  setTimerDuration: (value: number) => void;
  timerUnit: TimerUnit;
  setTimerUnit: (value: TimerUnit) => void;

  repeatFrequencySelectId: string;
  timerDurationSelectId: string;
  timerUnitSelectId: string;
}

export default function TaskSchedulingControls({
  themeColor,
  dueDate,
  setDueDate,
  isRepeatable,
  setIsRepeatable,
  repeatFrequency,
  setRepeatFrequency,
  repeatInterval,
  setRepeatInterval,
  hasTimer,
  setHasTimer,
  timerDuration,
  setTimerDuration,
  timerUnit,
  setTimerUnit,
  repeatFrequencySelectId,
  timerDurationSelectId,
  timerUnitSelectId,
}: TaskSchedulingControlsProps) {
  const timerOptions = useMemo(
    () => (timerUnit === "hours" ? TIMER_HOUR_OPTIONS : timerUnit === "seconds" ? TIMER_SECOND_OPTIONS : TIMER_MINUTE_OPTIONS),
    [timerUnit]
  );

  return (
    <div className="space-y-6">
      {/* Date */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: themeColor }}>
          Date
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDueDate(null)}
            className={`px-3 py-2 rounded-lg border-2 transition-all text-sm whitespace-nowrap ${
              dueDate === null
                ? "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
            }`}
          >
            None
          </button>
          <DatePicker
            id="task-due-date-optional"
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            dateFormat="MMM d, yyyy"
            placeholderText="Select a date"
            minDate={new Date()}
            showPopperArrow={false}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2.5 pr-10 focus:outline-none focus:border-transparent transition-colors"
            calendarClassName="bg-white dark:bg-gray-800 border-2 rounded-lg shadow-xl"
            wrapperClassName="flex-1"
          />
        </div>
      </div>

      {/* Repeatable Task & Timer - Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Repeatable Task */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 min-h-[44px]">
            <div
              className="relative flex-shrink-0 cursor-pointer mt-0.5"
              onClick={() => {
                const next = !isRepeatable;
                setIsRepeatable(next);
                if (next && !dueDate) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setDueDate(tomorrow);
                }
              }}
            >
              <input
                type="checkbox"
                checked={isRepeatable}
                onChange={() => {}}
                className="sr-only peer"
                tabIndex={-1}
              />
              <div
                className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer transition-colors"
                style={isRepeatable ? { backgroundColor: themeColor } : {}}
              />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight" style={{ color: themeColor }}>
                Repeatable Task
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Auto-reschedules after completion
              </div>
            </div>
          </div>

          {isRepeatable && (
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: themeColor }}>
                Frequency
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={repeatInterval}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0 && val <= 99) {
                      setRepeatInterval(val);
                    }
                  }}
                  className="w-16 px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                />
                <div className="flex-1">
                  <Select
                    id={repeatFrequencySelectId}
                    value={repeatFrequency}
                    onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)}
                    options={[
                      { value: "daily", label: repeatInterval === 1 ? "Day" : "Days" },
                      { value: "weekly", label: repeatInterval === 1 ? "Week" : "Weeks" },
                      { value: "monthly", label: repeatInterval === 1 ? "Month" : "Months" },
                      { value: "yearly", label: repeatInterval === 1 ? "Year" : "Years" },
                    ]}
                    size="sm"
                  />
                </div>
              </div>
              {!dueDate && (
                <p className="text-xs text-red-500 dark:text-red-400 text-right">
                  Date required for repeatable tasks
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 min-h-[44px]">
            <div
              className="relative flex-shrink-0 cursor-pointer mt-0.5"
              onClick={() => setHasTimer(!hasTimer)}
            >
              <input
                type="checkbox"
                checked={hasTimer}
                onChange={() => {}}
                className="sr-only peer"
                tabIndex={-1}
              />
              <div
                className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer transition-colors"
                style={hasTimer ? { backgroundColor: themeColor } : {}}
              />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight" style={{ color: themeColor }}>
                Timer
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Set a countdown timer for this task
              </div>
            </div>
          </div>

          {hasTimer && (
            <div className="grid grid-cols-2 gap-2">
              <Select
                id={timerDurationSelectId}
                label="Duration"
                value={String(timerDuration)}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  const max = timerUnit === "hours" ? 24 : 59;
                  const next = Number.isFinite(parsed) ? parsed : 1;
                  setTimerDuration(Math.min(max, Math.max(1, next)));
                }}
                options={timerOptions}
                size="sm"
              />
              <Select
                id={timerUnitSelectId}
                label="Unit"
                value={timerUnit}
                onChange={(e) => {
                  const nextUnit = e.target.value as TimerUnit;
                  setTimerUnit(nextUnit);

                  // Keep a reasonable value when switching units
                  if (nextUnit === "hours") {
                    setTimerDuration(Math.min(24, Math.max(1, 1)));
                  } else if (nextUnit === "minutes") {
                    setTimerDuration(Math.min(59, Math.max(1, 30)));
                  } else {
                    setTimerDuration(Math.min(59, Math.max(1, 30)));
                  }
                }}
                options={[
                  { value: "seconds", label: "Seconds" },
                  { value: "minutes", label: "Minutes" },
                  { value: "hours", label: "Hours" },
                ]}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
