/**
 * Global Timer Alert
 * 
 * Monitors all active timers and displays a modal alert when any timer completes.
 * This component should be mounted at the app level to work across all pages.
 */

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import { useActiveTimers } from "../../hooks/useTasksQueries";
import { calculateRemainingTime } from "../../utils/timerHelpers";
import { useTheme } from "../../hooks/useTheme";
import { logger } from "@/lib/logger";
import * as tasksService from "../../services/tasksService";
import type { Task } from "../../services/tasksService.types";

const GlobalTimerAlert: React.FC = () => {
  const { themeColor } = useTheme();
  const { data: activeTimers = [] } = useActiveTimers();
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [dismissedTimers, setDismissedTimers] = useState<Set<string>>(new Set());
  
  // Track timers that were running when we first saw them
  // This prevents showing alerts for timers that completed before page load
  const [trackedTimers, setTrackedTimers] = useState<Map<string, number>>(new Map());

  // Check for expired timers when activeTimers changes
  useEffect(() => {
    if (activeTimers.length === 0) {
      return;
    }

    const checkTimers = () => {
      activeTimers.forEach((task) => {
        // Skip if already dismissed or no timer data
        if (
          dismissedTimers.has(task.id) ||
          !task.timer_started_at ||
          !task.timer_duration_seconds ||
          task.timer_completed_at
        ) {
          return;
        }

        const startTime = new Date(task.timer_started_at).getTime();
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = calculateRemainingTime(
          task.timer_started_at,
          task.timer_duration_seconds
        );

        // Skip if timer started in the future
        if (elapsed < 0) {
          return;
        }

        // If this is the first time we're seeing this timer
        if (!trackedTimers.has(task.id)) {
          // Only track it if it's still running (not already completed)
          if (remaining > 0) {
            setTrackedTimers(prev => new Map(prev).set(task.id, now));
          }
          // Don't show alert for timers that were already completed when we loaded
          return;
        }

        // Check if timer has expired
        if (remaining === 0) {
          // Add to completed tasks list
          setCompletedTasks((prev) => {
            // Avoid duplicates
            if (prev.some((t) => t.id === task.id)) {
              return prev;
            }
            logger.info("Timer completed, showing alert", { taskId: task.id, taskTitle: task.title });
            return [...prev, task];
          });
        }
      });
    };

    checkTimers();
  }, [activeTimers, dismissedTimers, trackedTimers]);

  const handleDismissAll = () => {
    // Mark all completed tasks as dismissed so they don't re-appear
    setDismissedTimers((prev) => {
      const updated = new Set(prev);
      completedTasks.forEach(task => updated.add(task.id));
      return updated;
    });
    
    setCompletedTasks([]);
  };

  // Reset timers when user closes/refreshes the app
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Find all running timers (not completed and still has time remaining)
      const runningTimers = activeTimers.filter(task => {
        if (!task.timer_started_at || !task.timer_duration_seconds || task.timer_completed_at) {
          return false;
        }
        const remaining = calculateRemainingTime(task.timer_started_at, task.timer_duration_seconds);
        return remaining > 0;
      });

      // Reset all running timers synchronously during unload
      // Note: This is a best-effort approach; the requests may not complete before the page closes
      runningTimers.forEach(task => {
        void tasksService.resetTaskTimer(task.id);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTimers]);

  // Show modal only if there are completed tasks
  if (completedTasks.length === 0) {
    return null;
  }

  return (
        <Modal
          isOpen={true}
          onClose={handleDismissAll}
          title=""
          maxWidth="md"
          showCloseButton={true}
          closeOnBackdropClick={false}
          showHeader={false}
        >
      <div className="p-6">
        {/* Custom Header with Theme Color */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Clock className="w-6 h-6" style={{ color: themeColor }} />
          </div>
          <h2
            className="text-xl font-semibold font-heading"
            style={{ color: themeColor }}
          >
            Timer Complete!
          </h2>
        </div>

        {/* Completed Tasks List */}
        <div className="space-y-4 mb-6">
          {completedTasks.map((task) => {
            const durationSeconds = task.timer_duration_seconds || 0;
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = durationSeconds % 60;
            
            let timeDescription = '';
            if (hours > 0) {
              timeDescription = `${hours} hour${hours !== 1 ? 's' : ''}`;
              if (minutes > 0) timeDescription += `, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else if (minutes > 0) {
              timeDescription = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
              if (seconds > 0) timeDescription += `, ${seconds} second${seconds !== 1 ? 's' : ''}`;
            } else {
              timeDescription = `${seconds} second${seconds !== 1 ? 's' : ''}`;
            }

            return (
              <div key={task.id} className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {timeDescription}
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions - with divider above */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleDismissAll} variant="primary" size="md">
            Dismiss All
          </Button>
        </div>
      </div>
    </Modal>
      )}

export default GlobalTimerAlert;
