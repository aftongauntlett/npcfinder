/**
 * Inbox View (now called "Tasks")
 *
 * Displays tasks that don't belong to any board
 */

import React, { useState, useMemo } from "react";
import { ListChecks, Plus } from "lucide-react";
import TaskCard from "../../tasks/TaskCard";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import Button from "../../shared/ui/Button";
import MediaEmptyState from "../../media/MediaEmptyState";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import FilterSortMenu, {
  FilterSortSection,
} from "../../shared/common/FilterSortMenu";
import {
  useTasks,
  useUpdateTask,
  useDeleteTask,
} from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import { getNextDueDate } from "../../../utils/repeatableTaskHelpers";

const InboxView: React.FC = () => {
  const { data: tasks = [], isLoading } = useTasks(
    null as unknown as undefined,
    {
      unassigned: true,
    }
  );
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({
    sort: "custom",
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Filter/sort sections for FilterSortMenu
  const filterSortSections = useMemo((): FilterSortSection[] => {
    return [
      {
        id: "sort",
        title: "Sort By",
        options: [
          { id: "custom", label: "Custom" },
          { id: "date", label: "Date" },
          { id: "name", label: "Name" },
          { id: "priority", label: "Priority" },
        ],
      },
    ];
  }, []);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    const sortBy = activeFilters.sort as string;

    switch (sortBy) {
      case "custom":
        return sorted.sort((a, b) => {
          const orderA = a.display_order ?? 999999;
          const orderB = b.display_order ?? 999999;
          return orderA - orderB;
        });
      case "name":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "priority": {
        const priorityOrder: Record<string, number> = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        return sorted.sort((a, b) => {
          const priorityA = a.priority ? priorityOrder[a.priority] : 0;
          const priorityB = b.priority ? priorityOrder[b.priority] : 0;
          return priorityB - priorityA;
        });
      }
      case "date":
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [tasks, activeFilters.sort]);

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

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
          status: "todo", // Keep status as todo
          due_date: nextDueDate,
          last_completed_at: new Date().toISOString(),
        },
      });
    } else {
      // Normal toggle for non-repeatable tasks
      updateTask.mutate({
        taskId,
        updates: {
          status: task.status === "done" ? "todo" : "done",
        },
      });
    }
  };

  const handleSnooze = (taskId: string) => {
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
    setTaskToDelete(taskId);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTask.mutate(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
    setDraggedTask(task);
    // Small delay to allow browser to create drag image
    setTimeout(() => {
      const dragElement = e.currentTarget as HTMLElement;
      if (dragElement) {
        dragElement.style.opacity = "0.5";
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const dragElement = e.currentTarget as HTMLElement;
    if (dragElement) {
      dragElement.style.opacity = "1";
    }
    setDraggedTask(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedTask && draggedTask.id !== targetTask.id) {
      setDragOverId(targetTask.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);

    if (!draggedTask || draggedTask.id === targetTask.id) return;

    const draggedIndex = sortedTasks.findIndex((t) => t.id === draggedTask.id);
    const targetIndex = sortedTasks.findIndex((t) => t.id === targetTask.id);

    const reordered = [...sortedTasks];
    reordered.splice(draggedIndex, 1);

    const insertIndex =
      draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(insertIndex, 0, draggedTask);

    // Update display_order for ALL tasks to ensure consistency
    reordered.forEach((task, index) => {
      updateTask.mutate({
        taskId: task.id,
        updates: { display_order: index },
      });
    });

    setDraggedTask(null);
  };

  const isCustomSort = activeFilters.sort === "custom";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6">
        <MediaEmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Create quick one-off tasks here, or organize larger projects in boards."
          onClick={() => setShowCreateModal(true)}
          ariaLabel="Create your first task"
        />

        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Sort Menu */}
        <FilterSortMenu
          sections={filterSortSections}
          activeFilters={activeFilters}
          onFilterChange={(sectionId, value) => {
            setActiveFilters({ ...activeFilters, [sectionId]: value });
          }}
          label="Sort"
        />

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="action"
          size="md"
          icon={<Plus className="w-5 h-5" />}
        >
          New Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {/* Drop zone for top position */}
        {isCustomSort && draggedTask && sortedTasks.length > 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverId("__top__");
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverId(null);
              if (!draggedTask) return;

              const draggedIndex = sortedTasks.findIndex(
                (t) => t.id === draggedTask.id
              );

              if (draggedIndex === 0) return;

              const reordered = [...sortedTasks];
              reordered.splice(draggedIndex, 1);
              reordered.unshift(draggedTask);

              // Update ALL tasks to ensure consistency
              reordered.forEach((task, index) => {
                updateTask.mutate({
                  taskId: task.id,
                  updates: { display_order: index },
                });
              });

              setDraggedTask(null);
            }}
            className={`h-8 flex items-center justify-center transition-all duration-200 -mb-2 ${
              dragOverId === "__top__"
                ? "bg-primary/10 border-2 border-dashed border-primary rounded-lg"
                : "border-2 border-transparent"
            }`}
          >
            {dragOverId === "__top__" && (
              <span className="text-sm text-primary font-medium">
                Drop here to move to top
              </span>
            )}
          </div>
        )}
        {sortedTasks.map((task) => {
          const isDragging = draggedTask?.id === task.id;
          const isDropTarget = dragOverId === task.id;
          return (
            <div
              key={task.id}
              draggable={isCustomSort}
              onDragStart={(e) => isCustomSort && handleDragStart(e, task)}
              onDragEnd={(e) => isCustomSort && handleDragEnd(e)}
              onDragOver={(e) => isCustomSort && handleDragOver(e, task)}
              onDragLeave={(e) => isCustomSort && handleDragLeave(e)}
              onDrop={(e) => isCustomSort && handleDrop(e, task)}
              className={`relative transition-all duration-150 ${
                isCustomSort ? "cursor-move" : ""
              } ${isDragging ? "opacity-50" : "opacity-100"} ${
                isDropTarget ? "scale-[1.02]" : ""
              }`}
            >
              {/* Drop indicator line */}
              {isCustomSort && isDropTarget && (
                <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
              )}

              <TaskCard
                task={task}
                onToggleComplete={handleToggleComplete}
                onSnooze={handleSnooze}
                onRemove={handleRemove}
                onClick={() => setSelectedTask(task)}
              />
            </div>
          );
        })}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteTask.isPending}
      />
    </div>
  );
};

export default InboxView;
