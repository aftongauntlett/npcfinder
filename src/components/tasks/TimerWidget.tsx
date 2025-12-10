/**
 * Timer Widget
 *
 * Reusable timer display with countdown, progress bar, and controls
 * 
 * Refactored to use shared MediaTimeDisplay and ProgressBar components
 * for consistent time-based UI patterns across the application.
 */

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger";
import Toast from "../ui/Toast";
import MediaTimeDisplay from "../shared/ui/MediaTimeDisplay";
import ProgressBar from "../shared/ui/ProgressBar";
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
  // Local state for pause functionality
  const [isPaused, setIsPaused] = useState(false);
  const [pausedRemainingSeconds, setPausedRemainingSeconds] = useState(0);
  
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const startTimer = useStartTimer();
  const completeTimer = useCompleteTimer();

  const timerStatus = getTimerStatus(task);
  const showUrgentAlert = shouldShowUrgentAlert(task);

  // Update countdown every second
  // Note: completeTimer is intentionally not in dependencies to avoid infinite loops
  // The mutation is stable enough for this use case
  useEffect(() => {
    // Reset pause state when timer status changes from DB
    if (timerStatus === TIMER_STATUS.NOT_STARTED || timerStatus === TIMER_STATUS.COMPLETED) {
      setIsPaused(false);
      setPausedRemainingSeconds(0);
    }

    if (
      timerStatus === TIMER_STATUS.RUNNING &&
      task.timer_started_at &&
      task.timer_duration_minutes &&
      !isPaused // Only run countdown if not paused locally
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

        // Auto-complete only when timer naturally expires
        if (remaining === 0 && !task.timer_completed_at) {
          void completeTimer.mutateAsync(task.id);
          setShowToast(true);
        }
      };

      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else if (isPaused) {
      // When paused locally, use frozen values
      setRemainingSeconds(pausedRemainingSeconds);
      // Recalculate progress based on paused remaining time
      if (task.timer_duration_minutes) {
        const totalSeconds = task.timer_duration_minutes * 60;
        const elapsed = totalSeconds - pausedRemainingSeconds;
        setProgress(Math.min((elapsed / totalSeconds) * 100, 100));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timerStatus,
    task.timer_started_at,
    task.timer_duration_minutes,
    task.timer_completed_at,
    task.id,
    isPaused,
    pausedRemainingSeconds,
  ]);

  const handleStart = async () => {
    if (!task.timer_duration_minutes) {
      logger.error("Cannot start timer: timer_duration_minutes is not set", {
        taskId: task.id,
        timerDuration: task.timer_duration_minutes,
      });
      return;
    }

    logger.info("Starting timer", {
      taskId: task.id,
      durationMinutes: task.timer_duration_minutes,
    });

    try {
      await startTimer.mutateAsync({
        taskId: task.id,
        durationMinutes: task.timer_duration_minutes,
        isUrgentAfter: task.is_urgent_after_timer || undefined,
      });
      logger.info("Timer started successfully", { taskId: task.id });
    } catch (error) {
      logger.error("Failed to start timer", { error, taskId: task.id });
    }
  };

  const handlePause = async () => {
    // Pause locally - do NOT update database
    if (!task.timer_started_at || !task.timer_duration_minutes) return;
    
    const remaining = calculateRemainingTime(
      task.timer_started_at,
      task.timer_duration_minutes
    );
    
    logger.info("Pausing timer locally", {
      taskId: task.id,
      remainingSeconds: remaining,
    });
    
    setIsPaused(true);
    setPausedRemainingSeconds(remaining);
  };

  const handleResume = async () => {
    try {
      // Resume by computing new timer_started_at based on remaining time
      logger.info("Resuming timer", {
        taskId: task.id,
        remainingSeconds: pausedRemainingSeconds,
      });
      
      // Calculate new start time: now - (total duration - remaining time)
      const totalDurationMs = pausedRemainingSeconds * 1000;
      const newStartTime = new Date(Date.now() - (task.timer_duration_minutes! * 60 * 1000 - totalDurationMs));
      
      await startTimer.mutateAsync({
        taskId: task.id,
        durationMinutes: task.timer_duration_minutes!,
        isUrgentAfter: task.is_urgent_after_timer || undefined,
        startTime: newStartTime.toISOString(),
      });
      
      setIsPaused(false);
      setPausedRemainingSeconds(0);
      logger.info("Timer resumed successfully", { taskId: task.id });
    } catch (error) {
      logger.error("Failed to resume timer", { error, taskId: task.id });
    }
  };

  const handleRestart = async () => {
    if (!task.timer_duration_minutes) {
      logger.error("Cannot restart timer: timer_duration_minutes is not set", {
        taskId: task.id,
        timerDuration: task.timer_duration_minutes,
      });
      return;
    }

    logger.info("Restarting timer", {
      taskId: task.id,
      durationMinutes: task.timer_duration_minutes,
    });

    try {
      // Start timer (this automatically clears timer_completed_at)
      await startTimer.mutateAsync({
        taskId: task.id,
        durationMinutes: task.timer_duration_minutes,
        isUrgentAfter: task.is_urgent_after_timer || undefined,
      });
      logger.info("Timer restarted successfully", { taskId: task.id });
    } catch (error) {
      logger.error("Failed to restart timer", { error, taskId: task.id });
    }
  };

  // Compact version for list views
  if (compact) {
    if (timerStatus === TIMER_STATUS.NOT_STARTED && !isPaused) {
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

    if ((timerStatus === TIMER_STATUS.RUNNING && !isPaused) || (timerStatus === TIMER_STATUS.NOT_STARTED && isPaused)) {
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

    if (isPaused) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
          <Pause className="w-3 h-3" />
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
    <>
      <div className="space-y-3">
        <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
          Timer
        </h4>
        
        {/* Always show the same compact timer layout */}
        <div className="flex flex-col items-center w-full">
          {/* Time Display with optional status pill */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <MediaTimeDisplay 
              seconds={timerStatus === TIMER_STATUS.NOT_STARTED ? 0 : remainingSeconds} 
              format="countdown" 
              size="lg" 
            />
            {isPaused && (
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
                Paused
              </span>
            )}
            {timerStatus === TIMER_STATUS.COMPLETED && (
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                Completed
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full mb-3">
            <ProgressBar
              progress={timerStatus === TIMER_STATUS.NOT_STARTED ? 0 : timerStatus === TIMER_STATUS.COMPLETED ? 100 : progress}
              variant="primary"
              size="md"
              containerPadding={false}
              showThumb={false}
              ariaLabel="Timer progress"
            />
          </div>

          {/* Icon Controls */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {/* Play/Pause button */}
            {timerStatus === TIMER_STATUS.RUNNING && !isPaused ? (
              <button
                onClick={() => void handlePause()}
                disabled={completeTimer.isPending}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-primary/10 dark:bg-gray-700/50 dark:hover:bg-primary/20 text-gray-700 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Pause timer"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : isPaused ? (
              <button
                onClick={() => void handleResume()}
                disabled={startTimer.isPending}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-primary/10 dark:bg-gray-700/50 dark:hover:bg-primary/20 text-gray-700 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Resume timer"
                title="Resume"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => void handleStart()}
                disabled={startTimer.isPending}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-primary/10 dark:bg-gray-700/50 dark:hover:bg-primary/20 text-gray-700 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Start timer"
                title="Play"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {/* Restart button */}
            <button
              onClick={() => void handleRestart()}
              disabled={startTimer.isPending || (timerStatus === TIMER_STATUS.NOT_STARTED && !isPaused)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Restart timer"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast notification for timer completion */}
      {showToast && (
        <Toast
          message={`${task.title} - Timer Complete!`}
          onClose={() => setShowToast(false)}
          duration={8000}
        />
      )}
    </>
  );
};

export default TimerWidget;
