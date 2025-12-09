/**
 * Task Timer Section Component
 * Presentational component for displaying timer information
 */

import React from "react";
import { AlertCircle } from "lucide-react";
import TimerWidget from "./TimerWidget";
import type { Task } from "../../services/tasksService.types";
import { shouldShowUrgentAlert } from "../../utils/timerHelpers";

interface TaskTimerSectionProps {
  task: Task;
}

const TaskTimerSection: React.FC<TaskTimerSectionProps> = ({ task }) => {
  if (!task.timer_duration_minutes) {
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
