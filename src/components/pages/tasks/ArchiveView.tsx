/**
 * Archive View
 *
 * Displays completed and archived tasks grouped by date
 */

import React, { useMemo, useRef } from "react";
import { Archive as ArchiveIcon, Inbox } from "lucide-react";
import TaskCard from "../../tasks/TaskCard";
import EmptyState from "../../shared/common/EmptyState";
import { Pagination } from "../../shared/common/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useArchivedTasks } from "../../../hooks/useTasksQueries";
import { groupTasksByDate } from "../../../utils/taskHelpers";

const ArchiveView: React.FC = () => {
  const { data: archivedTasks = [], isLoading } = useArchivedTasks();
  const listTopRef = useRef<HTMLDivElement>(null);

  // Pagination
  const pagination = usePagination({
    items: archivedTasks,
    initialItemsPerPage: 10,
    persistenceKey: "tasks-archive",
  });

  // Group paginated tasks by completion date
  const groupedTasks = useMemo(() => {
    return groupTasksByDate(pagination.paginatedItems);
  }, [pagination.paginatedItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">
          Loading archive...
        </div>
      </div>
    );
  }

  if (archivedTasks.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={Inbox}
          title="Archive is empty"
          description="Completed tasks will appear here. Archive tasks to keep your boards clean while preserving your work history."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div ref={listTopRef} />
      {Object.entries(groupedTasks).map(([dateGroup, tasks]) => (
        <div key={dateGroup} className="space-y-3">
          <div className="flex items-center gap-2">
            <ArchiveIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {dateGroup}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({tasks.length})
              </span>
            </h3>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} variant="detailed" />
            ))}
          </div>
        </div>
      ))}

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
    </div>
  );
};

export default ArchiveView;
