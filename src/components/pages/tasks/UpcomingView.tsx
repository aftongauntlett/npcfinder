/**
 * Upcoming View
 *
 * Displays tasks with future due dates
 */

import React, { useState, useMemo } from "react";
import { CalendarClock, Plus } from "lucide-react";
import TaskCard from "../../tasks/TaskCard";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import MediaEmptyState from "../../media/MediaEmptyState";
import Button from "../../shared/ui/Button";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";

const UpcomingView: React.FC = () => {
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  const tomorrowStr = useMemo(
    () => tomorrow.toISOString().split("T")[0],
    [tomorrow]
  );

  const { data: allTasks = [], isLoading } = useTasks(undefined, {
    dueAfter: tomorrowStr,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter and sort upcoming tasks
  const upcomingTasks = useMemo(() => {
    return allTasks
      .filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate > tomorrow;
      })
      .sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [allTasks, tomorrow]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    upcomingTasks.forEach((task) => {
      if (!task.due_date) return;
      const date = task.due_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
    });
    return groups;
  }, [upcomingTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">
          Loading upcoming tasks...
        </div>
      </div>
    );
  }

  if (upcomingTasks.length === 0) {
    return (
      <>
        <div className="mt-6">
          <MediaEmptyState
            icon={CalendarClock}
            title="No upcoming tasks"
            description="You don't have any tasks scheduled for the future. Add due dates to your tasks to see them here."
            onClick={() => setShowCreateModal(true)}
          />
        </div>

        {showCreateModal && (
          <CreateTaskModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </>
    );
  }

  const formatDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upcoming
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {upcomingTasks.length}{" "}
            {upcomingTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="action"
          size="md"
          icon={<Plus className="w-5 h-5" />}
        >
          New Task
        </Button>
      </div>

      {/* Grouped Task List */}
      <div className="space-y-6">
        {Object.entries(tasksByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, tasks]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {formatDateHeader(date)}
              </h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} onClick={() => setSelectedTask(task)}>
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default UpcomingView;
