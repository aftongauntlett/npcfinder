/**
 * Boards View
 *
 * Displays all Kanban boards in a list view similar to Tasks
 */

import React, { useState, useMemo } from "react";
import { Plus, LayoutGrid } from "lucide-react";
import Button from "../../shared/ui/Button";
import MediaEmptyState from "../../media/MediaEmptyState";
import BoardFormModal from "../../tasks/BoardFormModal";
import BoardCard from "../../tasks/BoardCard";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import FilterSortMenu, {
  FilterSortSection,
} from "../../shared/common/FilterSortMenu";
import { useBoards, useDeleteBoard } from "../../../hooks/useTasksQueries";
import type { BoardWithStats } from "../../../services/tasksService.types";

interface BoardsViewProps {
  onSelectBoard: (boardId: string) => void;
  onCreateTask?: (boardId: string, sectionId?: string) => void;
  onEditTask?: (taskId: string) => void;
  isMobile?: boolean;
}

const BoardsView: React.FC<BoardsViewProps> = ({
  onSelectBoard,
  onCreateTask,
  onEditTask,
  isMobile = false,
}) => {
  const { data: boards = [], isLoading } = useBoards();
  const deleteBoard = useDeleteBoard();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardWithStats | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<BoardWithStats | null>(
    null
  );
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({
    sort: "date",
  });

  const handleDeleteBoard = () => {
    if (deletingBoard) {
      deleteBoard.mutate(deletingBoard.id);
      setDeletingBoard(null);
    }
  };

  // Filter/sort sections for FilterSortMenu
  const filterSortSections = useMemo((): FilterSortSection[] => {
    return [
      {
        id: "sort",
        title: "Sort By",
        options: [
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">
          Loading boards...
        </div>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6">
        <MediaEmptyState
          icon={LayoutGrid}
          title="No boards yet"
          description="Create boards to organize your tasks by project, category, or any way you like."
          onClick={() => setShowCreateModal(true)}
          ariaLabel="Create your first board"
        />

        <BoardFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Filter & Sort Menu */}
        <FilterSortMenu
          sections={filterSortSections}
          activeFilters={activeFilters}
          onFilterChange={(sectionId, value) => {
            setActiveFilters({ ...activeFilters, [sectionId]: value });
          }}
        />

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="action"
          size="md"
          icon={<Plus className="w-5 h-5" />}
        >
          Create Board
        </Button>
      </div>

      {/* Boards List */}
      <div className="space-y-3">
        {sortedBoards.map((board) => {
          const isStarter = board.field_config?.starter === true;
          return (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={() => setEditingBoard(board)}
              onDelete={() => setDeletingBoard(board)}
              onOpenInTab={isMobile ? undefined : () => onSelectBoard(board.id)}
              onClick={isMobile ? () => onSelectBoard(board.id) : undefined}
              onCreateTask={(sectionId) => onCreateTask?.(board.id, sectionId)}
              onEditTask={(task) => onEditTask?.(task.id)}
              isMobile={isMobile}
              isStarter={isStarter}
            />
          );
        })}
      </div>

      {/* Create Board Modal */}
      <BoardFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Board Modal */}
      {editingBoard && (
        <BoardFormModal
          isOpen={!!editingBoard}
          onClose={() => setEditingBoard(null)}
          board={editingBoard}
        />
      )}

      {/* Delete Confirmation */}
      {deletingBoard && (
        <ConfirmDialog
          isOpen={!!deletingBoard}
          onClose={() => setDeletingBoard(null)}
          onConfirm={handleDeleteBoard}
          title="Delete Board"
          message={`Are you sure you want to delete "${deletingBoard.name}"? All tasks in this board will be permanently removed.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
};

export default BoardsView;
