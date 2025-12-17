/**
 * Timer Widget
 *
 * Reusable timer display with countdown, progress bar, and controls
 * 
 * Refactored to use shared MediaTimeDisplay and ProgressBar components
 * for consistent time-based UI patterns across the application.
 * 
 * Performance: Uses IntersectionObserver to pause updates when off-screen
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Clock } from "lucide-react";
import { logger } from "@/lib/logger";
import MediaTimeDisplay from "../shared/ui/MediaTimeDisplay";
import ProgressBar from "../shared/ui/ProgressBar";
import type { Task } from "../../services/tasksService.types";
import {
  getTimerStatus,
  calculateRemainingTime,
  getTimerProgress,
  getTimerColor,
} from "../../utils/timerHelpers";
import { TIMER_STATUS } from "../../utils/taskConstants";
import { useStartTimer, useCompleteTimer } from "../../hooks/useTasksQueries";
import { usePerformanceMonitor } from "../../hooks/usePerformanceMonitor";

interface TimerWidgetProps {
  task: Task;
  compact?: boolean;
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ task, compact = false }) => {
  // Helper to get/set pause state from localStorage
  const getPauseState = () => {
    try {
      const stored = localStorage.getItem(`timer-pause-${task.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only use stored pause state if timer hasn't changed
        if (parsed.timer_started_at === task.timer_started_at && parsed.timer_duration === task.timer_duration_seconds) {
          return { isPaused: true, remainingSeconds: parsed.remainingSeconds };
        }
      }
    } catch {
      // Ignore errors
    }
    return { isPaused: false, remainingSeconds: 0 };
  };

  const savePauseState = (isPaused: boolean, remainingSeconds: number) => {
    try {
      if (isPaused) {
        localStorage.setItem(`timer-pause-${task.id}`, JSON.stringify({
          timer_started_at: task.timer_started_at,
          timer_duration: task.timer_duration_seconds,
          remainingSeconds,
        }));
      } else {
        localStorage.removeItem(`timer-pause-${task.id}`);
      }
    } catch {
      // Ignore errors
    }
  };

  // Initialize pause state from localStorage
  const initialPauseState = getPauseState();
  
  // Local state for pause functionality
  const [isPaused, setIsPaused] = useState(initialPauseState.isPaused);
  const [pausedRemainingSeconds, setPausedRemainingSeconds] = useState(initialPauseState.remainingSeconds);
  
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<HTMLDivElement>(null);

  const startTimer = useStartTimer();
  const completeTimer = useCompleteTimer();

  const timerStatus = getTimerStatus(task);

  usePerformanceMonitor({ componentName: "TimerWidget", threshold: 60 });

  // Use IntersectionObserver to detect if timer is visible
  useEffect(() => {
    if (!timerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(timerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Update countdown every second
  // Note: completeTimer is intentionally not in dependencies to avoid infinite loops
  // The mutation is stable enough for this use case
  useEffect(() => {
    // Reset pause state when timer status changes from DB
    if (timerStatus === TIMER_STATUS.NOT_STARTED || timerStatus === TIMER_STATUS.COMPLETED) {
      setIsPaused(false);
      setPausedRemainingSeconds(0);
      savePauseState(false, 0); // Clear localStorage
    }

    if (
      timerStatus === TIMER_STATUS.RUNNING &&
      task.timer_started_at &&
      task.timer_duration_seconds &&
      !isPaused && // Only run countdown if not paused locally
      isVisible // Only update when visible
    ) {
      const updateTimer = () => {
        const remaining = calculateRemainingTime(
          task.timer_started_at!,
          task.timer_duration_seconds!
        );
        const prog = getTimerProgress(
          task.timer_started_at!,
          task.timer_duration_seconds!
        );
        setRemainingSeconds(remaining);
        setProgress(prog);

        // Auto-complete only when timer naturally expires
        if (remaining === 0 && !task.timer_completed_at) {
          void completeTimer.mutateAsync(task.id);
        }
      };

      // Intentionally "catch up" the countdown when widget re-enters viewport
      // This ensures timers that expired while hidden are immediately detected
      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else if (isPaused) {
      // When paused locally, use frozen values
      setRemainingSeconds(pausedRemainingSeconds);
      // Recalculate progress based on paused remaining time
      if (task.timer_duration_seconds) {
        const totalSeconds = task.timer_duration_seconds;
        const elapsed = totalSeconds - pausedRemainingSeconds;
        setProgress(Math.min((elapsed / totalSeconds) * 100, 100));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timerStatus,
    task.timer_started_at,
    task.timer_duration_seconds,
    task.timer_completed_at,
    task.id,
    isPaused,
    pausedRemainingSeconds,
    isVisible,
  ]);

  const handleStart = async () => {
    if (!task.timer_duration_seconds) {
      logger.error("Cannot start timer: timer_duration_seconds is not set", {
        taskId: task.id,
        timerDuration: task.timer_duration_seconds,
      });
      return;
    }

    logger.info("Starting timer", {
      taskId: task.id,
      durationSeconds: task.timer_duration_seconds,
    });

    try {
      await startTimer.mutateAsync({
        taskId: task.id,
        durationMinutes: task.timer_duration_seconds,
      });
      savePauseState(false, 0); // Clear any stored pause state
      logger.info("Timer started successfully", { taskId: task.id });
    } catch (error) {
      logger.error("Failed to start timer", { error, taskId: task.id });
    }
  };

  const handlePause = async () => {
    // Pause locally - do NOT update database
    if (!task.timer_started_at || !task.timer_duration_seconds) return;
    
    const remaining = calculateRemainingTime(
      task.timer_started_at,
      task.timer_duration_seconds
    );
    
    logger.info("Pausing timer locally", {
      taskId: task.id,
      remainingSeconds: remaining,
    });
    
    setIsPaused(true);
    setPausedRemainingSeconds(remaining);
    savePauseState(true, remaining);
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
      const newStartTime = new Date(Date.now() - (task.timer_duration_seconds! * 1000 - totalDurationMs));
      
      await startTimer.mutateAsync({
        taskId: task.id,
        durationMinutes: task.timer_duration_seconds!,
        startTime: newStartTime.toISOString(),
      });
      
      setIsPaused(false);
      setPausedRemainingSeconds(0);
      savePauseState(false, 0);
      logger.info("Timer resumed successfully", { taskId: task.id });
    } catch (error) {
      logger.error("Failed to resume timer", { error, taskId: task.id });
    }
  };

  const handleRestart = async () => {
    if (!task.timer_duration_seconds) {
      logger.error("Cannot restart timer: timer_duration_seconds is not set", {
        taskId: task.id,
        timerDuration: task.timer_duration_seconds,
      });
      return;
    }

    logger.info("Restarting timer", {
      taskId: task.id,
      durationSeconds: task.timer_duration_seconds,
    });

    try {
      // Start timer (this automatically clears timer_completed_at)
      await startTimer.mutateAsync({
        taskId: task.id,
        durationMinutes: task.timer_duration_seconds,
      });
      savePauseState(false, 0); // Clear any stored pause state
      logger.info("Timer restarted successfully", { taskId: task.id });
    } catch (error) {
      logger.error("Failed to restart timer", { error, taskId: task.id });
    }
  };

  // Compact version for list views - simplified to icon-only for reliability
  if (compact) {
    // Show paused state FIRST - highest priority
    if (isPaused && timerStatus === TIMER_STATUS.RUNNING) {
      return (
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" title="Timer paused">
          <Pause className="w-4 h-4" />
        </div>
      );
    }

    // Not started - show start button
    if (timerStatus === TIMER_STATUS.NOT_STARTED) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void handleStart();
          }}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
          disabled={startTimer.isPending}
          title="Start timer"
        >
          <Play className="w-4 h-4" />
        </button>
      );
    }

    // Running (and not paused) - show animated icon only
    if (timerStatus === TIMER_STATUS.RUNNING) {
      const colors = getTimerColor(progress);
      return (
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full ${colors.bg} ${colors.text}`}
          title="Timer running"
        >
          <Clock className="w-4 h-4 animate-pulse" />
        </div>
      );
    }

    if (timerStatus === TIMER_STATUS.COMPLETED) {
      return (
        <div
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
        >
          <CheckCircle className="w-3 h-3" />
          <span>Done</span>
        </div>
      );
    }

    return null;
  }

  // Full version for detail views
  return (
    <>
      <div ref={timerRef} className="space-y-3">
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
    </>
  );
};

export default TimerWidget;
