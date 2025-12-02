/**
 * Today View
 *
 * Displays tasks due today or overdue, grouped by board
 */

import React, { useState, useMemo } from "react";
import { Plus, ListTodo, SlidersHorizontal } from "lucide-react";
import TaskCard from "../../tasks/TaskCard";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import MediaEmptyState from "../../media/MediaEmptyState";
import Button from "../../shared/ui/Button";
import {
  useTodayTasks,
  useBoards,
  useToggleTaskStatus,
  useDeleteTask,
  useUpdateTask,
} from "../../../hooks/useTasksQueries";
import { groupTasksByBoard } from "../../../utils/taskHelpers";
import { getNextDueDate } from "../../../utils/repeatableTaskHelpers";
import type {
  BoardWithStats,
  Task,
} from "../../../services/tasksService.types";

const TodayView: React.FC = () => {
  const { data: todayTasks = [], isLoading } = useTodayTasks();
  const { data: boards = [] } = useBoards();
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskBoardId, setCreateTaskBoardId] = useState<
    string | undefined
  >();

  // Group tasks by board
  const groupedTasks = useMemo(() => {
    return groupTasksByBoard(todayTasks);
  }, [todayTasks]);

  // Create a map of board IDs to board names
  const boardMap = useMemo(() => {
    const map: Record<string, BoardWithStats> = {};
    boards.forEach((board) => {
      map[board.id] = board;
    });
    return map;
  }, [boards]);

  const handleToggleComplete = (taskId: string) => {
    const task = todayTasks.find((t) => t.id === taskId);
    if (!task) {
      toggleStatus.mutate(taskId);
      return;
    }

    // If task is repeatable and being marked complete
    if (task.is_repeatable && task.status !== "done" && task.due_date) {
      const nextDueDate = getNextDueDate(
        task.due_date,
        task.repeat_frequency || "weekly",
        task.repeat_custom_days || undefined
      );

      updateTask.mutate({
        taskId,
        updates: {
          status: "todo",
          due_date: nextDueDate,
          last_completed_at: new Date().toISOString(),
        },
      });
    } else {
      toggleStatus.mutate(taskId);
    }
  };

  const handleSnooze = (taskId: string) => {
    // Snooze until tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateTask.mutate({
      taskId,
      updates: {
        due_date: tomorrow.toISOString().split("T")[0],
      },
    });
  };

  const handleRemove = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  if (todayTasks.length === 0) {
    return (
      <>
        <div className="mt-6">
          <MediaEmptyState
            icon={ListTodo}
            title="Your task list is empty"
            description="You haven't added any tasks yet. Add tasks to start tracking what you're currently working on!"
            onClick={() => {
              if (boards.length === 0) {
                // If no boards exist, user needs to create a board first
                // We could redirect to Boards tab or show a message
                alert(
                  "Create a board first in the Boards tab to organize your tasks!"
                );
              } else {
                setShowCreateModal(true);
              }
            }}
            ariaLabel="Add your first task"
          />
        </div>

        {/* Modals */}
        {boards.length > 0 && showCreateModal && (
          <CreateTaskModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setCreateTaskBoardId(undefined);
            }}
            boardId={createTaskBoardId || boards[0].id}
          />
        )}

        {selectedTask && (
          <TaskDetailModal
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            task={selectedTask}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="secondary"
          size="md"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => {
            /* TODO: Add filter/sort functionality */
          }}
        >
          Filters & Sort
        </Button>

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="action"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          aria-label="Create new task"
        >
          Add Task
        </Button>
      </div>

      {/* Tasks Grouped by Board */}
      {Object.entries(groupedTasks).map(([boardId, tasks]) => {
        const board = boardMap[boardId];
        const boardName = board?.name || "Unknown Board";

        return (
          <div key={boardId} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {board?.icon && <span>{board.icon}</span>}
              {boardName}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({tasks.length})
              </span>
            </h3>

            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="detailed"
                  onToggleComplete={handleToggleComplete}
                  onSnooze={handleSnooze}
                  onRemove={handleRemove}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Modals */}
      {boards.length > 0 && showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateTaskBoardId(undefined);
          }}
          boardId={createTaskBoardId || boards[0].id}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default TodayView;
