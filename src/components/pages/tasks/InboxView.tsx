/**
 * Inbox View (now called "Tasks")
 *
 * Displays tasks that don't belong to any board
 */

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { ListChecks, Plus, Minimize2 } from "lucide-react";
import TaskCard from "../../tasks/TaskCard";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import Button from "../../shared/ui/Button";
import { EmptyStateAddCard, LocalSearchInput } from "../../shared";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import { Pagination } from "../../shared/common/Pagination";
import DroppableTopZone from "../../shared/common/DroppableTopZone";
import { usePagination } from "../../../hooks/usePagination";
import { useDraggableList } from "../../../hooks/useDraggableList";
import FilterSortMenu, {
  FilterSortSection,
} from "../../shared/common/FilterSortMenu";
import {
  useTasks,
  useUpdateTask,
  useReorderTasks,
  useDeleteTask,
  useCompleteRepeatableTask,
} from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import {
  getPersistedFilters,
  persistFilters,
} from "../../../utils/persistenceUtils";
import { logger } from "@/lib/logger";

const InboxView: React.FC = () => {
  // Collapse state
  const [collapseKey, setCollapseKey] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleCollapseAll = () => {
    setCollapseKey((prev) => prev + 1);
    setExpandedItems(new Set());
  };

  const handleExpandChange = (id: string, isExpanded: boolean) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const { data: tasks = [], isLoading } = useTasks(
    null as unknown as undefined,
    {
      unassigned: true,
    },
  );
  const updateTask = useUpdateTask();
  const reorderTasks = useReorderTasks();
  const deleteTask = useDeleteTask();
  const completeRepeatableTask = useCompleteRepeatableTask();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{
    taskId: string;
    boardId: string | null;
  } | null>(null);

  // Load persisted filter state
  const persistenceKey = "tasks-inbox-filters";
  const persistedFilters = getPersistedFilters(persistenceKey, {
    sort: "custom",
  });

  const [activeFilters, setActiveFilters] =
    useState<Record<string, string | string[]>>(persistedFilters);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Persist filter changes
  useEffect(() => {
    persistFilters(persistenceKey, activeFilters);
  }, [activeFilters]);

  const listTopRef = useRef<HTMLDivElement>(null);

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
      case "date":
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
  }, [tasks, activeFilters.sort]);

  // Filter by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return sortedTasks;

    const query = searchQuery.toLowerCase();
    return sortedTasks.filter((task) => {
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription =
        task.description?.toLowerCase().includes(query) || false;
      return matchesTitle || matchesDescription;
    });
  }, [sortedTasks, searchQuery]);

  // Pagination
  const pagination = usePagination({
    items: filteredTasks,
    initialItemsPerPage: 10,
    persistenceKey: "tasks-inbox",
  });

  const handleToggleComplete = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        logger.error("Task not found in cache", { taskId });
        return;
      }

      // Prevent duplicate mutations if one is already pending
      if (updateTask.isPending) {
        return;
      }

      // If task is repeatable and has a due date, use the proper mutation
      if (task.is_repeatable && task.due_date) {
        completeRepeatableTask.mutate(taskId);
      } else {
        // Normal toggle for non-repeatable tasks
        updateTask.mutate({
          taskId,
          updates: {
            status: task.status === "done" ? "todo" : "done",
          },
        });
      }
    },
    [tasks, updateTask, completeRepeatableTask],
  );

  const handleSnooze = useCallback(
    (taskId: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      updateTask.mutate({
        taskId,
        updates: {
          due_date: tomorrow.toISOString().split("T")[0],
        },
      });
    },
    [updateTask],
  );

  const handleRemove = useCallback((taskId: string, boardId: string | null) => {
    setTaskToDelete({ taskId, boardId });
  }, []);

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTask.mutate({
        taskId: taskToDelete.taskId,
        boardId: taskToDelete.boardId || "inbox",
      });
      setTaskToDelete(null);
    }
  };

  const {
    draggedItem: draggedTask,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDraggableList<Task>(pagination.paginatedItems, (reordered) => {
    reorderTasks.mutate({
      taskIds: reordered.map((task) => task.id),
      boardId: null,
    });
  });

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
        <EmptyStateAddCard
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
      <div
        ref={listTopRef}
        className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Search Input with Filter Button */}
        <div className="w-full flex items-center gap-2 sm:flex-1 sm:max-w-md">
          <div className="flex-1 min-w-0">
            <LocalSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Tasks..."
              filterButton={
                <FilterSortMenu
                  sections={filterSortSections}
                  activeFilters={activeFilters}
                  onFilterChange={(sectionId, value) => {
                    setActiveFilters({ ...activeFilters, [sectionId]: value });
                  }}
                  label=""
                />
              }
            />
          </div>

          {/* Mobile: icon-only create button inline with search */}
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="action"
            size="icon"
            icon={<Plus className="w-5 h-5" />}
            className="sm:hidden"
            aria-label="New task"
            title="New task"
          />
        </div>

        {/* Right side buttons (desktop only) */}
        <div className="hidden sm:flex items-center justify-end gap-3 w-full sm:w-auto">
          {/* Collapse All Button - Only show when items are expanded */}
          {expandedItems.size > 0 && (
            <Button
              onClick={handleCollapseAll}
              variant="subtle"
              size="md"
              icon={<Minimize2 className="w-4 h-4" />}
            >
              Collapse All
            </Button>
          )}

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="action"
            size="md"
            icon={<Plus className="w-5 h-5" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <DroppableTopZone
          visible={
            isCustomSort &&
            !!draggedTask &&
            pagination.paginatedItems.length > 0
          }
          isActive={dragOverId === "__top__"}
          onDragOver={(e) => handleDragOver(e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e)}
        />
        {pagination.paginatedItems.map((task) => {
          const isDragging = draggedTask?.id === task.id;
          const isDropTarget = dragOverId === String(task.id);
          return (
            <div
              key={`${task.id}-${collapseKey}`}
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
                onExpandChange={(isExpanded) =>
                  handleExpandChange(task.id, isExpanded)
                }
              />
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.filteredItems.length}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={(page) => {
          pagination.goToPage(page);
          listTopRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
        onItemsPerPageChange={(count) => {
          pagination.setItemsPerPage(count);
          listTopRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={tasks.find((t) => t.id === selectedTask.id) || selectedTask}
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
