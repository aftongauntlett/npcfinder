/**
 * CalendarView Component
 *
 * Displays a calendar with event dots for days that have tasks with due dates.
 * Can be used in both interactive mode (Tasks page) and read-only mode (Dashboard).
 * Uses react-day-picker for full calendar grid display.
 */

import React, { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useCalendarTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import "react-day-picker/dist/style.css";
import "../../../styles/datepicker.css";

interface CalendarViewProps {
  /** Callback when a day is clicked (optional, omit for read-only mode) */
  onDayClick?: (date: Date) => void;
  /** Whether the calendar is read-only (no day clicks) */
  readOnly?: boolean;
  /** Whether to show compact version (for Dashboard) */
  compact?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  onDayClick,
  readOnly = false,
  compact = false,
}) => {
  const { data: tasks = [], isLoading, error, refetch } = useCalendarTasks();

  // Create a map of dates to task counts for event dots
  // Use pure date string (yyyy-MM-dd) to avoid timezone issues
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (task.due_date) {
        // If due_date is already in YYYY-MM-DD format, use it directly
        // Otherwise format it to avoid timezone issues
        const dateKey = task.due_date.includes('T') 
          ? format(new Date(task.due_date), 'yyyy-MM-dd')
          : task.due_date;
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });

    return map;
  }, [tasks]);

  // Get days that have tasks for modifiers
  const daysWithTasks = useMemo(() => {
    return Array.from(tasksByDate.keys()).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  }, [tasksByDate]);

  // Handle day click
  const handleDayClick = (date: Date | undefined) => {
    if (!readOnly && date && onDayClick) {
      onDayClick(date);
    }
  };

  // Check if a day has tasks (for custom rendering)
  const modifiers = {
    hasTasks: daysWithTasks,
  };

  const modifiersClassNames = {
    hasTasks: 'calendar-has-tasks',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          Loading calendar...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-600 dark:text-red-400 text-center">
          Failed to load calendar tasks
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`calendar-view-wrapper ${compact ? 'calendar-view-compact' : 'calendar-view-full'}`}>
      <DayPicker
        mode="single"
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        disabled={readOnly}
        showOutsideDays
        fixedWeeks
      />
    </div>
  );
};

export default CalendarView;
