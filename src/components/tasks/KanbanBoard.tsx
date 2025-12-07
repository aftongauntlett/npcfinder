/**
 * Kanban Board Component
 * Drag-and-drop board for managing tasks across sections
 */

import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  useBoardSections,
  useTasks,
  useMoveTask,
  useUpdateSection,
} from "../../hooks/useTasksQueries";
import type { Task } from "../../services/tasksService.types";
import KanbanColumn from "./KanbanColumn";
import { EmptyStateAddCard } from "../shared";

interface KanbanBoardProps {
  boardId: string;
  onCreateTask: (sectionId?: string) => void;
  onEditTask: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  onCreateTask,
  onEditTask,
}) => {
  const { data: sections = [] } = useBoardSections(boardId);
  const { data: tasks = [] } = useTasks(boardId);
  const moveTask = useMoveTask();
  const updateSection = useUpdateSection();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleRenameSection = (sectionId: string, newName: string) => {
    void updateSection.mutateAsync({
      boardId,
      sectionId,
      updates: { name: newName },
    });
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (targetSectionId: string, targetTaskId?: string) => {
    if (!draggedTask) return;

    // If dropped on a specific task, calculate order
    if (targetTaskId) {
      const targetTask = tasks.find((t) => t.id === targetTaskId);
      if (targetTask) {
        void moveTask.mutateAsync({
          taskId: draggedTask.id,
          sectionId: targetTask.section_id || null,
          newOrder: targetTask.display_order || 0,
        });
      }
    } else {
      // Dropped on section
      if (draggedTask.section_id !== targetSectionId) {
        const sectionTasks = tasks.filter(
          (t) => t.section_id === targetSectionId
        );
        const newOrder = sectionTasks.length;
        void moveTask.mutateAsync({
          taskId: draggedTask.id,
          sectionId: targetSectionId,
          newOrder,
        });
      }
    }
    setDraggedTask(null);
  };

  // Group tasks by section
  const tasksBySection = tasks.reduce((acc, task) => {
    const sectionId = task.section_id || "unsectioned";
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort tasks within each section by display_order
  Object.keys(tasksBySection).forEach((sectionId) => {
    tasksBySection[sectionId].sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    );
  });

  if (sections.length === 0) {
    return (
      <EmptyStateAddCard
        icon={Plus}
        title="No sections in this board yet"
        description="Add your first task to get started"
        onClick={() => onCreateTask()}
        ariaLabel="Add your first task to this board"
        className="min-h-[400px]"
      />
    );
  }

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {sections.slice(0, 3).map((section) => {
        const sectionTasks = tasksBySection[section.id] || [];
        return (
          <KanbanColumn
            key={section.id}
            section={section}
            tasks={sectionTasks}
            onCreateTask={() => onCreateTask(section.id)}
            onEditTask={onEditTask}
            onRenameSection={handleRenameSection}
            onDeleteSection={undefined}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        );
      })}
    </div>
  );
};

export default KanbanBoard;
