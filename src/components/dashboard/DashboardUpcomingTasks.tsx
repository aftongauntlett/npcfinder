/**
 * Dashboard Upcoming Tasks Component
 * 
 * Displays tasks with due dates within the next 5 days on the dashboard
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { useUpcomingTasks } from "@/hooks/useTasksQueries";
import { formatDueDate, getDueDateChipColor } from "@/utils/taskHelpers";
import { getTaskIconOptionByName } from "@/utils/taskIcons";
import { ListTodo } from "lucide-react";
import TimerWidget from "../tasks/TimerWidget";

export const DashboardUpcomingTasks: React.FC = () => {
  const { data: upcomingTasks = [], isLoading } = useUpcomingTasks();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Tasks
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (upcomingTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Tasks
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tasks due in the next 5 days. You're all caught up! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Tasks
        </h2>
        <button
          onClick={() => navigate("/app/tasks")}
          className="text-sm text-primary dark:text-primary-light hover:underline flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {upcomingTasks.map((task) => {
          const taskIconOption = getTaskIconOptionByName(task.icon);
          const TaskIcon = taskIconOption?.icon ?? ListTodo;
          const isLucideIcon = taskIconOption == null;
          const hasActiveTimer = task.timer_started_at && !task.timer_completed_at && task.timer_duration_seconds;

          return (
            <button
              key={task.id}
              onClick={() => navigate("/app/tasks")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
              {/* Icon */}
              <span
                className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0"
                style={{
                  backgroundColor: task.icon_color
                    ? `${task.icon_color}15`
                    : undefined,
                }}
              >
                {isLucideIcon ? (
                  <TaskIcon
                    className="w-4 h-4"
                    style={{ color: task.icon_color || undefined }}
                  />
                ) : (
                  <TaskIcon
                    className="w-4 h-4"
                    weight="regular"
                    style={{ color: task.icon_color || undefined }}
                  />
                )}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {task.title}
                  </h3>
                  {task.due_date && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${getDueDateChipColor(
                        task.due_date
                      )}`}
                    >
                      <Calendar className="w-3 h-3" />
                      {formatDueDate(task.due_date)}
                    </span>
                  )}
                  {hasActiveTimer && (
                    <TimerWidget task={task} compact={true} />
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
