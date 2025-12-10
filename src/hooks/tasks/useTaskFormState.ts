/**
 * Task Form State Hook
 * Manages generic task form fields (title, description, priority, due date, tags)
 * Provides an updates builder for the base Task object
 */

import { useState, useEffect } from "react";
import type { Task } from "../../services/tasksService.types";

// Task.priority is broader than TaskPriority constant
type TaskPriorityValue = Task["priority"];

export interface UseTaskFormStateReturn {
  // Generic task fields
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  priority: TaskPriorityValue;
  setPriority: (priority: TaskPriorityValue) => void;
  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;
  tags: string;
  setTags: (tags: string) => void;

  // Builder function for base task updates
  buildBaseUpdates: () => Partial<Task>;
}

export function useTaskFormState(task: Task): UseTaskFormStateReturn {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<TaskPriorityValue>(task.priority);
  const [dueDate, setDueDate] = useState<Date | null>(
    task.due_date ? new Date(task.due_date) : null
  );
  const [tags, setTags] = useState(task.tags?.join(", ") || "");

  // Update form when task changes (including when fresh data is fetched)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.due_date ? new Date(task.due_date) : null);
    setTags(task.tags?.join(", ") || "");
  }, [task]);

  const buildBaseUpdates = (): Partial<Task> => ({
    title,
    description: description || null,
    priority: priority || null,
    due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
    tags: tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : null,
  });

  return {
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    tags,
    setTags,
    buildBaseUpdates,
  };
}
