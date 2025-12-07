/**
 * Simple List View Component
 * Simple single-column list view for tasks (no sections/columns)
 */

import { Plus } from "lucide-react";
import { useRef } from "react";
import { useTasks } from "../../hooks/useTasksQueries";
import { usePagination } from "../../hooks/usePagination";
import { Pagination } from "../shared/common/Pagination";
import { EmptyStateAddCard } from "../shared";
import type { Task } from "../../services/tasksService.types";
import TaskCard from "./TaskCard";
import Button from "../shared/ui/Button";

interface SimpleListViewProps {
  boardId: string;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const SimpleListView: React.FC<SimpleListViewProps> = ({
  boardId,
  onCreateTask,
  onEditTask,
}) => {
  const { data: tasks = [] } = useTasks(boardId);
  const listTopRef = useRef<HTMLDivElement>(null);

  // Sort tasks by display_order, then by created_at
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Pagination
  const pagination = usePagination({
    items: sortedTasks,
    initialItemsPerPage: 10,
    persistenceKey: `tasks-simple-${boardId}`,
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with Add Button - only show when tasks exist */}
      {sortedTasks.length > 0 && (
        <div
          ref={listTopRef}
          className="flex items-center justify-between mb-4 px-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tasks ({pagination.filteredItems.length})
          </h3>
          <Button
            onClick={() => onCreateTask()}
            variant="action"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Task
          </Button>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 flex flex-col">
        {sortedTasks.length === 0 ? (
          <EmptyStateAddCard
            icon={Plus}
            title="No tasks yet"
            description="Click here to add your first task"
            onClick={onCreateTask}
            ariaLabel="Add your first task"
            className="min-h-[400px]"
          />
        ) : (
          <>
            <div className="space-y-2 px-2">
              {pagination.paginatedItems.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onEditTask(task)}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 px-2">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SimpleListView;
