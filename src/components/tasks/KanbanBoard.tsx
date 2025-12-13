/**
 * Kanban Board Component
 * Drag-and-drop board for managing tasks across sections
 *
 * Memoized: Drag handlers and section sorting optimized to prevent unnecessary rerenders
 */

import React, { useCallback, useMemo, useRef } from "react";
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

const KanbanBoardComponent: React.FC<KanbanBoardProps> = ({
  boardId,
  onCreateTask,
  onEditTask,
}) => {
  const { data: sections = [] } = useBoardSections(boardId);
  const { data: tasks = [] } = useTasks(boardId);
  const moveTask = useMoveTask();
  const updateSection = useUpdateSection();
  const draggedTaskRef = useRef<Task | null>(null);

  const handleRenameSection = useCallback(
    (sectionId: string, newName: string) => {
      void updateSection.mutateAsync({
        boardId,
        sectionId,
        updates: { name: newName },
      });
    },
    [updateSection, boardId]
  );

  const handleDragStart = useCallback((task: Task) => {
    draggedTaskRef.current = task;
  }, []);

  const handleDragEnd = useCallback(() => {
    // Don't clear draggedTask immediately - handleDrop needs it
    // Schedule cleanup in case drop never happens (e.g., drag cancelled)
    setTimeout(() => {
      draggedTaskRef.current = null;
    }, 100);
  }, []);

  const handleDrop = useCallback(
    (targetSectionId: string, targetTaskId?: string) => {
      const draggedTask = draggedTaskRef.current;

      if (!draggedTask) {
        return;
      }

      // If dropped on a specific task, calculate order
      if (targetTaskId) {
        const targetTask = tasks.find((t) => t.id === targetTaskId);
        if (targetTask && draggedTask.id !== targetTaskId) {
          void moveTask.mutateAsync({
            taskId: draggedTask.id,
            sectionId: targetTask.section_id || null,
            newOrder: targetTask.display_order || 0,
          });
        }
      } else {
        // Dropped on section (empty area or column background)
        const sectionTasks = tasks.filter(
          (t) => t.section_id === targetSectionId && t.id !== draggedTask.id
        );
        const newOrder = sectionTasks.length;

        // Only move if changing sections or if this would change the order
        if (
          draggedTask.section_id !== targetSectionId ||
          draggedTask.display_order !== newOrder
        ) {
          void moveTask.mutateAsync({
            taskId: draggedTask.id,
            sectionId: targetSectionId,
            newOrder,
          });
        }
      }
      draggedTaskRef.current = null;
    },
    [tasks, moveTask]
  );

  // Group tasks by section - memoized to prevent recalculation on every render
  const tasksBySection = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const sectionId = task.section_id || "unsectioned";
      if (!acc[sectionId]) {
        acc[sectionId] = [];
      }
      acc[sectionId].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Sort tasks within each section by display_order
    Object.keys(grouped).forEach((sectionId) => {
      grouped[sectionId].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
    });

    return grouped;
  }, [tasks]);

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
    <div>
      {/* Visually hidden h2 for proper heading hierarchy (h1 board title -> h2 board sections -> h3 column names) */}
      <h2 className="sr-only">Board Sections</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 md:gap-4 sm:overflow-x-auto sm:pb-4 sm:snap-x sm:snap-mandatory md:snap-none sm:scrollbar-thin sm:scrollbar-thumb-gray-400 sm:dark:scrollbar-thumb-gray-600 sm:scrollbar-track-transparent">
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
    </div>
  );
};

// Memoize to prevent rerenders when props haven't changed
export default React.memo(KanbanBoardComponent);
