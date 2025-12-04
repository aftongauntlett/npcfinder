/**
 * Timer Widget
 *
 * Reusable timer display with countdown, progress bar, and controls
 */

import React, { useState, useEffect } from "react";
import { Play, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Button from "../shared/ui/Button";
import type { Task } from "../../services/tasksService.types";
import {
  getTimerStatus,
  calculateRemainingTime,
  formatTimerDuration,
  getTimerProgress,
  getTimerColor,
  shouldShowUrgentAlert,
} from "../../utils/timerHelpers";
import { TIMER_STATUS } from "../../utils/taskConstants";
import { useStartTimer, useCompleteTimer } from "../../hooks/useTasksQueries";

interface TimerWidgetProps {
  task: Task;
  compact?: boolean;
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ task, compact = false }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [progress, setProgress] = useState(0);

  const startTimer = useStartTimer();
  const completeTimer = useCompleteTimer();

  const timerStatus = getTimerStatus(task);
  const showUrgentAlert = shouldShowUrgentAlert(task);

  // Update countdown every second
  useEffect(() => {
    if (
      timerStatus === TIMER_STATUS.RUNNING &&
      task.timer_started_at &&
      task.timer_duration_minutes
    ) {
      const updateTimer = () => {
        const remaining = calculateRemainingTime(
          task.timer_started_at!,
          task.timer_duration_minutes!
        );
        const prog = getTimerProgress(
          task.timer_started_at!,
          task.timer_duration_minutes!
        );
        setRemainingSeconds(remaining);
        setProgress(prog);

        // Auto-complete if timer expired
        if (remaining === 0 && !task.timer_completed_at) {
          void completeTimer.mutateAsync(task.id);
        }
      };

      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [
    timerStatus,
    task.timer_started_at,
    task.timer_duration_minutes,
    task.timer_completed_at,
    task.id,
    completeTimer,
  ]);

  const handleStart = async () => {
    if (!task.timer_duration_minutes) return;

    try {
      await startTimer.mutateAsync({
        taskId: task.id,
        durationMinutes: task.timer_duration_minutes,
        isUrgentAfter: task.is_urgent_after_timer || undefined,
      });
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const handleComplete = async () => {
    try {
      await completeTimer.mutateAsync(task.id);
    } catch (error) {
      console.error("Failed to complete timer:", error);
    }
  };

  // Compact version for list views
  if (compact) {
    if (timerStatus === TIMER_STATUS.NOT_STARTED) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void handleStart();
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
          disabled={startTimer.isPending}
        >
          <Play className="w-3 h-3" />
          <span>{task.timer_duration_minutes}m</span>
        </button>
      );
    }

    if (timerStatus === TIMER_STATUS.RUNNING) {
      const colors = getTimerColor(progress);
      return (
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${colors.bg} ${colors.text}`}
        >
          <Clock className="w-3 h-3 animate-pulse" />
          <span>{formatTimerDuration(remainingSeconds)}</span>
        </div>
      );
    }

    if (timerStatus === TIMER_STATUS.COMPLETED) {
      return (
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
            showUrgentAlert
              ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          }`}
        >
          {showUrgentAlert ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          <span>Done</span>
        </div>
      );
    }

    return null;
  }

  // Full version for detail views
  return (
    <div className="space-y-3">
      {/* Timer Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Timer
          </h3>
        </div>
        {showUrgentAlert && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">
              Urgent
            </span>
          </div>
        )}
      </div>

      {/* Timer Display */}
      {timerStatus === TIMER_STATUS.NOT_STARTED && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Duration: {task.timer_duration_minutes} minutes
          </p>
          <Button
            onClick={() => void handleStart()}
            disabled={startTimer.isPending}
            variant="action"
            size="sm"
            icon={<Play className="w-4 h-4" />}
          >
            Start Timer
          </Button>
        </div>
      )}

      {timerStatus === TIMER_STATUS.RUNNING && (
        <div className="space-y-3">
          {/* Countdown */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
              {formatTimerDuration(remainingSeconds)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progress < 50
                  ? "bg-green-500"
                  : progress < 80
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Complete Button */}
          <Button
            onClick={() => void handleComplete()}
            disabled={completeTimer.isPending}
            variant="secondary"
            size="sm"
            icon={<CheckCircle className="w-4 h-4" />}
            className="w-full"
          >
            Complete
          </Button>
        </div>
      )}

      {timerStatus === TIMER_STATUS.COMPLETED && (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Timer completed
          </p>
          {task.timer_completed_at && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(task.timer_completed_at).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerWidget;
