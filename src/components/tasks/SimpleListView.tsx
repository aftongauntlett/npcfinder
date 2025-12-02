/**
 * Simple List View Component
 * Simple single-column list view for tasks (no sections/columns)
 */

import { Plus } from "lucide-react";
import { useTasks } from "../../hooks/useTasksQueries";
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

  // Sort tasks by display_order, then by created_at
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with Add Button - only show when tasks exist */}
      {sortedTasks.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tasks ({tasks.length})
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
          <button
            onClick={() => onCreateTask()}
            className="flex-1 min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex flex-col items-center gap-3">
              <Plus className="w-16 h-16 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                No tasks yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                Click here to add your first task
              </p>
            </div>
          </button>
        ) : (
          <div className="space-y-2 px-2">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onEditTask(task)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleListView;
