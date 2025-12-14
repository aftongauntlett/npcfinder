import { useMemo } from "react";

import Select from "@/components/shared/ui/Select";

const TIMER_MINUTE_OPTIONS = Array.from({ length: 59 }, (_, i) => {
  const value = String(i + 1);
  return { value, label: value };
});

const TIMER_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i + 1);
  return { value, label: value };
});

type RepeatFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

type TimerUnit = "minutes" | "hours";

interface TaskSchedulingControlsProps {
  themeColor: string;

  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;

  isRepeatable: boolean;
  setIsRepeatable: (value: boolean) => void;
  repeatFrequency: RepeatFrequency;
  setRepeatFrequency: (value: RepeatFrequency) => void;

  hasTimer: boolean;
  setHasTimer: (value: boolean) => void;
  timerDuration: number;
  setTimerDuration: (value: number) => void;
  timerUnit: TimerUnit;
  setTimerUnit: (value: TimerUnit) => void;
  isUrgentAfterTimer: boolean;
  setIsUrgentAfterTimer: (value: boolean) => void;

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
  hasTimer,
  setHasTimer,
  timerDuration,
  setTimerDuration,
  timerUnit,
  setTimerUnit,
  isUrgentAfterTimer,
  setIsUrgentAfterTimer,
  repeatFrequencySelectId,
  timerDurationSelectId,
  timerUnitSelectId,
}: TaskSchedulingControlsProps) {
  const timerOptions = useMemo(
    () => (timerUnit === "hours" ? TIMER_HOUR_OPTIONS : TIMER_MINUTE_OPTIONS),
    [timerUnit]
  );

  return (
    <>
      {/* Left: repeatable */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="relative flex-shrink-0 cursor-pointer"
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
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Repeatable Task
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Auto-reschedules after completion
            </p>
          </div>
        </div>

        {isRepeatable && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-14">
            <Select
              id={repeatFrequencySelectId}
              label="Frequency"
              value={repeatFrequency}
              onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "biweekly", label: "Bi-weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Annually" },
              ]}
              size="sm"
            />
            {!dueDate && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 col-span-2">
                ⚠️ Date required for repeatable tasks
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: timer */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="relative flex-shrink-0 cursor-pointer"
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
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Add Timer
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Set a countdown timer for this task
            </p>
          </div>
        </div>

        {hasTimer && (
          <div className="ml-14 space-y-3">
            <div className="grid grid-cols-2 gap-3">
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

                  if (nextUnit === "hours") {
                    setTimerDuration(
                      Math.min(24, Math.max(1, Math.ceil(timerDuration / 60)))
                    );
                  } else {
                    setTimerDuration(Math.min(59, Math.max(1, timerDuration * 60)));
                  }
                }}
                options={[
                  { value: "minutes", label: "Minutes" },
                  { value: "hours", label: "Hours" },
                ]}
                size="sm"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={isUrgentAfterTimer}
                onChange={(e) => setIsUrgentAfterTimer(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 checked:bg-current focus:ring-2 focus:ring-offset-2 cursor-pointer"
                style={{
                  accentColor: isUrgentAfterTimer ? themeColor : undefined,
                }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                Mark as urgent when timer completes
              </span>
            </label>
          </div>
        )}
      </div>
    </>
  );
}
