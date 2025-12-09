/**
 * Task Reminder Section Component
 * Presentational component for displaying reminder information
 */

import React from "react";
import { Bell } from "lucide-react";
import type { Task } from "../../services/tasksService.types";

interface TaskReminderSectionProps {
  task: Task;
}

const TaskReminderSection: React.FC<TaskReminderSectionProps> = ({ task }) => {
  if (!task.reminder_date) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Reminder
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(task.reminder_date).toLocaleString()}
          </p>
          {task.reminder_sent_at && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Sent: {new Date(task.reminder_sent_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskReminderSection;
