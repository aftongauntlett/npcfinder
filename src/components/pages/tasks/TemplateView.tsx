/**
 * Template View
 *
 * Displays boards for a specific template type
 * Replaces the accordion-based BoardsView with template-specific card views
 */

import React, { useState, useMemo } from "react";
import { Plus, LayoutGrid, Briefcase, ChefHat, ListTodo } from "lucide-react";
import Button from "../../shared/ui/Button";
import MediaEmptyState from "../../media/MediaEmptyState";
import BoardFormModal from "../../tasks/BoardFormModal";
import BoardCard from "../../tasks/BoardCard";
import { JobTrackerView } from "../../tasks/views/JobTrackerView";
import { RecipeListView } from "../../tasks/views/RecipeListView";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import FilterSortMenu, {
  FilterSortSection,
} from "../../shared/common/FilterSortMenu";
import {
  useDeleteBoard,
  useUpdateBoard,
  useDeleteTask,
} from "../../../hooks/useTasksQueries";
import type { BoardWithStats } from "../../../services/tasksService.types";
import type { TemplateType } from "../../../utils/boardTemplates";

interface TemplateViewProps {
  templateType: TemplateType;
  boards: BoardWithStats[];
  onCreateTask?: (boardId: string, sectionId?: string) => void;
  onEditTask?: (taskId: string) => void;
}

// Template metadata
const TEMPLATE_META = {
  kanban: {
    icon: LayoutGrid,
    title: "Kanban Boards",
    emptyTitle: "No kanban boards yet",
    emptyDescription:
      "Create a kanban board to organize tasks in columns with drag-and-drop functionality.",
  },
  markdown: {
    icon: ListTodo,
    title: "To-Do Lists",
    emptyTitle: "No to-do lists yet",
    emptyDescription:
      "Create a markdown-style to-do list with support for formatting and bullets.",
  },
  grocery: {
    icon: Plus,
    title: "Grocery Lists",
    emptyTitle: "No grocery lists yet",
    emptyDescription:
      "Create a grocery list to organize items by category and share with family.",
  },
  job_tracker: {
    icon: Briefcase,
    title: "Job Applications",
    emptyTitle: "No job applications yet",
    emptyDescription:
      "Track your job search progress with company details and application status.",
  },
  recipe: {
    icon: ChefHat,
    title: "Recipes",
    emptyTitle: "No recipes yet",
    emptyDescription:
      "Save and organize your favorite recipes with ingredients and instructions.",
  },
};

const TemplateView: React.FC<TemplateViewProps> = ({
  templateType,
  boards,
  onCreateTask,
  onEditTask,
}) => {
  const deleteBoard = useDeleteBoard();
  const updateBoard = useUpdateBoard();
  const deleteTask = useDeleteTask();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardWithStats | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<BoardWithStats | null>(
    null
  );
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({
    sort: "custom",
  });
  const [draggedBoard, setDraggedBoard] = useState<BoardWithStats | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const meta =
    TEMPLATE_META[templateType as keyof typeof TEMPLATE_META] ||
    TEMPLATE_META.kanban;

  // Only kanban, markdown, and grocery templates allow multiple boards
  const allowsMultipleBoards =
    templateType === "kanban" ||
    templateType === "markdown" ||
    templateType === "grocery";

  const handleDeleteBoard = () => {
    if (deletingBoard) {
      deleteBoard.mutate(deletingBoard.id);
      setDeletingBoard(null);
    }
  };

  const handleDeleteTask = () => {
    if (deletingTask) {
      deleteTask.mutate(deletingTask);
      setDeletingTask(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, board: BoardWithStats) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", board.id);
    setDraggedBoard(board);
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
    setDraggedBoard(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetBoard: BoardWithStats) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedBoard && draggedBoard.id !== targetBoard.id) {
      setDragOverId(targetBoard.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetBoard: BoardWithStats) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedBoard || draggedBoard.id === targetBoard.id) return;

    const draggedIndex = sortedBoards.findIndex(
      (b) => b.id === draggedBoard.id
    );
    const targetIndex = sortedBoards.findIndex((b) => b.id === targetBoard.id);

    const reordered = [...sortedBoards];
    reordered.splice(draggedIndex, 1);

    const insertIndex =
      draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(insertIndex, 0, draggedBoard);

    // Update display_order for ALL boards to ensure consistency
    reordered.forEach((board, index) => {
      updateBoard.mutate({
        boardId: board.id,
        updates: { display_order: index },
      });
    });

    setDraggedBoard(null);
  };

  const isCustomSort = activeFilters.sort === "custom";

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
          { id: "tasks", label: "Task Count" },
        ],
      },
    ];
  }, []);

  // Sort boards
  const sortedBoards = useMemo(() => {
    const sorted = [...boards];
    const sortBy = activeFilters.sort as string;
    switch (sortBy) {
      case "custom":
        return sorted.sort((a, b) => {
          const orderA = a.display_order ?? 999999;
          const orderB = b.display_order ?? 999999;
          return orderA - orderB;
        });
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "tasks":
        return sorted.sort(
          (a, b) => (b.total_tasks || 0) - (a.total_tasks || 0)
        );
      case "date":
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [boards, activeFilters.sort]);

  if (boards.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6">
        <MediaEmptyState
          icon={meta.icon}
          title={meta.emptyTitle}
          description={meta.emptyDescription}
          onClick={() => setShowCreateModal(true)}
          ariaLabel={`Create your first ${templateType} board`}
        />

        <BoardFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          preselectedTemplate={templateType}
        />
      </div>
    );
  }

  // For job_tracker and recipe templates, show the list view directly (no board cards)
  if (templateType === "job_tracker" && boards.length > 0) {
    const board = sortedBoards[0]; // Use the first (and typically only) board
    return (
      <div className="container mx-auto px-4 sm:px-6">
        <JobTrackerView
          boardId={board.id}
          onCreateTask={() => onCreateTask?.(board.id)}
          onEditTask={(task) => onEditTask?.(task.id)}
          onDeleteTask={(taskId) => setDeletingTask(taskId)}
        />

        {/* Delete Task Confirmation */}
        {deletingTask && (
          <ConfirmationModal
            isOpen={!!deletingTask}
            onClose={() => setDeletingTask(null)}
            onConfirm={handleDeleteTask}
            title="Delete Job Application?"
            message="Are you sure you want to delete this job application? This action cannot be undone."
            confirmText="Delete"
            variant="danger"
            isLoading={deleteTask.isPending}
          />
        )}
      </div>
    );
  }

  if (templateType === "recipe" && boards.length > 0) {
    const board = sortedBoards[0]; // Use the first (and typically only) board
    return (
      <div className="container mx-auto px-4 sm:px-6">
        <RecipeListView
          boardId={board.id}
          onCreateTask={() => onCreateTask?.(board.id)}
          onViewRecipe={(task) => {
            if (onEditTask) {
              onEditTask(task.id);
            }
          }}
          onDeleteTask={(taskId) => setDeletingTask(taskId)}
        />

        {/* Delete Task Confirmation */}
        {deletingTask && (
          <ConfirmationModal
            isOpen={!!deletingTask}
            onClose={() => setDeletingTask(null)}
            onConfirm={handleDeleteTask}
            title="Delete Recipe?"
            message="Are you sure you want to delete this recipe? This action cannot be undone."
            confirmText="Delete"
            variant="danger"
            isLoading={deleteTask.isPending}
          />
        )}
      </div>
    );
  }

  // For kanban and markdown templates, show board cards
  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Filter & Sort Menu */}
        <FilterSortMenu
          sections={filterSortSections}
          activeFilters={activeFilters}
          onFilterChange={(sectionId, value) => {
            setActiveFilters({ ...activeFilters, [sectionId]: value });
          }}
          label="Sort"
        />

        {allowsMultipleBoards && (
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="action"
            size="md"
            icon={<Plus className="w-5 h-5" />}
          >
            Create Board
          </Button>
        )}
      </div>

      {/* Boards List */}
      <div className="space-y-3">
        {/* Drop zone for top position */}
        {isCustomSort && draggedBoard && sortedBoards.length > 0 && (
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
              if (!draggedBoard) return;

              const draggedIndex = sortedBoards.findIndex(
                (b) => b.id === draggedBoard.id
              );

              if (draggedIndex === 0) return;

              const reordered = [...sortedBoards];
              reordered.splice(draggedIndex, 1);
              reordered.unshift(draggedBoard);

              // Update ALL boards to ensure consistency
              reordered.forEach((board, index) => {
                updateBoard.mutate({
                  boardId: board.id,
                  updates: { display_order: index },
                });
              });

              setDraggedBoard(null);
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
        {sortedBoards.map((board) => {
          const isStarter = board.field_config?.starter === true;
          const isDragging = draggedBoard?.id === board.id;
          const isDropTarget = dragOverId === board.id;
          return (
            <div
              key={board.id}
              draggable={isCustomSort}
              onDragStart={(e) => isCustomSort && handleDragStart(e, board)}
              onDragEnd={(e) => isCustomSort && handleDragEnd(e)}
              onDragOver={(e) => isCustomSort && handleDragOver(e, board)}
              onDragLeave={(e) => isCustomSort && handleDragLeave(e)}
              onDrop={(e) => isCustomSort && handleDrop(e, board)}
              className={`relative group/board transition-all duration-150 ${
                isCustomSort ? "cursor-move" : ""
              } ${isDragging ? "opacity-50" : "opacity-100"} ${
                isDropTarget ? "scale-[1.02]" : ""
              }`}
            >
              {/* Drop indicator line */}
              {isCustomSort && isDropTarget && (
                <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
              )}

              <BoardCard
                board={board}
                onEdit={
                  allowsMultipleBoards
                    ? () => setEditingBoard(board)
                    : undefined
                }
                onDelete={
                  allowsMultipleBoards
                    ? () => setDeletingBoard(board)
                    : undefined
                }
                onCreateTask={(sectionId) =>
                  onCreateTask?.(board.id, sectionId)
                }
                onEditTask={(task) => onEditTask?.(task.id)}
                onDeleteTask={(taskId) => setDeletingTask(taskId)}
                isStarter={isStarter}
              />
            </div>
          );
        })}
      </div>

      {/* Create Board Modal - only for multi-board templates */}
      {allowsMultipleBoards && (
        <BoardFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          preselectedTemplate={templateType}
        />
      )}

      {/* Edit Board Modal - only for multi-board templates */}
      {allowsMultipleBoards && editingBoard && (
        <BoardFormModal
          isOpen={!!editingBoard}
          onClose={() => setEditingBoard(null)}
          board={editingBoard}
        />
      )}

      {/* Delete Board Confirmation - only for multi-board templates */}
      {allowsMultipleBoards && deletingBoard && (
        <ConfirmationModal
          isOpen={!!deletingBoard}
          onClose={() => setDeletingBoard(null)}
          onConfirm={handleDeleteBoard}
          title="Delete Board?"
          message={`Are you sure you want to delete "${deletingBoard.name}"? All tasks in this board will be permanently removed.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteBoard.isPending}
        />
      )}

      {/* Delete Task Confirmation */}
      {deletingTask && (
        <ConfirmationModal
          isOpen={!!deletingTask}
          onClose={() => setDeletingTask(null)}
          onConfirm={handleDeleteTask}
          title="Delete Task?"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          isLoading={deleteTask.isPending}
        />
      )}
    </div>
  );
};

export default TemplateView;
