/**
 * Task Form State Hook
 * Manages generic task form fields (title, description, due date)
 * Provides an updates builder for the base Task object
 */

import { useState, useEffect } from "react";
import type { Task } from "../../services/tasksService.types";

export interface UseTaskFormStateReturn {
  // Generic task fields
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;

  // Builder function for base task updates
  buildBaseUpdates: () => Partial<Task>;
}

export function useTaskFormState(task: Task): UseTaskFormStateReturn {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState<Date | null>(
    task.due_date ? new Date(task.due_date) : null
  );

  // Update form when task changes (including when fresh data is fetched)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.due_date ? new Date(task.due_date) : null);
  }, [task]);

  const buildBaseUpdates = (): Partial<Task> => ({
    title,
    description: description || null,
    due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
  });

  return {
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    buildBaseUpdates,
  };
}
