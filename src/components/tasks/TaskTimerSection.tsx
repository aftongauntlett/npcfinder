/**
 * Task Timer Section Component
 * Presentational component for displaying timer information
 * Automatically removes timer data when completed to clean up the UI
 */

import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import TimerWidget from "./TimerWidget";
import type { Task } from "../../services/tasksService.types";
import {
  shouldShowUrgentAlert,
  getTimerStatus,
} from "../../utils/timerHelpers";
import { TIMER_STATUS } from "../../utils/taskConstants";
import { useUpdateTask } from "../../hooks/useTasksQueries";

interface TaskTimerSectionProps {
  task: Task;
}

const TaskTimerSection: React.FC<TaskTimerSectionProps> = ({ task }) => {
  const updateTask = useUpdateTask();
  const timerStatus = getTimerStatus(task);

  // Auto-remove timer data when completed to prevent showing completed timer UI
  useEffect(() => {
    if (timerStatus === TIMER_STATUS.COMPLETED && task.timer_duration_minutes) {
      // Remove timer fields from task
      void updateTask.mutateAsync({
        taskId: task.id,
        updates: {
          timer_duration_minutes: null,
          timer_started_at: null,
          timer_completed_at: null,
          is_urgent_after_timer: null,
        },
      });
    }
  }, [timerStatus, task.id, task.timer_duration_minutes, updateTask]);

  if (!task.timer_duration_minutes) {
    return null;
  }

  // Don't show if completed (will be removed by useEffect)
  if (timerStatus === TIMER_STATUS.COMPLETED) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {shouldShowUrgentAlert(task) && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Timer completed - marked as urgent
          </p>
        </div>
      )}
      <TimerWidget task={task} />
    </div>
  );
};

export default TaskTimerSection;
