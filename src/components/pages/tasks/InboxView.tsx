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
import FilterSortMenu, {
  FilterSortSection,
} from "../../shared/common/FilterSortMenu";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";

const InboxView: React.FC = () => {
  const { data: tasks = [], isLoading } = useTasks(
    null as unknown as undefined,
    {
      unassigned: true,
    }
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({
    sort: "date",
  });

  // Filter/sort sections for FilterSortMenu
  const filterSortSections = useMemo((): FilterSortSection[] => {
    return [
      {
        id: "sort",
        title: "Sort By",
        options: [
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="container mx-auto px-6">
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
    <div className="container mx-auto px-6">
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
          New Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => setSelectedTask(task)}
          />
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

export default InboxView;
