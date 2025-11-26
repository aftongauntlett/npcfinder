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
    <div className="w-full max-w-3xl mx-auto">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tasks ({tasks.length})
        </h3>
        <Button
          onClick={onCreateTask}
          variant="action"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <Plus className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                No tasks yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Click "Add Task" to get started
              </p>
            </div>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onEditTask(task)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SimpleListView;
