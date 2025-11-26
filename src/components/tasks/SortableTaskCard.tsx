/**
 * Sortable Task Card
 * Wrapper around TaskCard to make it draggable
 */

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";
import type { Task } from "../../services/tasksService.types";

interface SortableTaskCardProps {
  task: Task;
  onEditTask: (task: Task) => void;
}

export const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  onEditTask,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        variant="kanban"
        onClick={() => onEditTask(task)}
        draggable
      />
    </div>
  );
};
