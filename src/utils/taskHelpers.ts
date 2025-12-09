/**
 * Utility functions for task-related operations
 * Includes date helpers, status helpers, grouping, sorting, and validation
 */

import {
  isToday as dateFnsIsToday,
  isTomorrow as dateFnsIsTomorrow,
  isPast,
  differenceInDays,
  format,
  isThisWeek,
  isThisMonth,
  isYesterday,
} from "date-fns";
import type { Task, BoardSection } from "../services/tasksService.types";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "./taskConstants";

// =====================================================
// DATE HELPERS
// =====================================================

/**
 * Check if a task is overdue
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  return isPast(date) && !dateFnsIsToday(date);
}

/**
 * Check if a task is due today
 */
export function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dateFnsIsToday(new Date(dueDate));
}

/**
 * Check if a task is due tomorrow
 */
export function isTomorrow(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dateFnsIsTomorrow(new Date(dueDate));
}

/**
 * Format due date for display
 * Returns "Overdue", "Today", "Tomorrow", or formatted date
 */
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date";

  const date = new Date(dueDate);

  if (isOverdue(dueDate)) {
    const days = Math.abs(differenceInDays(new Date(), date));
    return days === 1 ? "1 day overdue" : `${days} days overdue`;
  }

  if (dateFnsIsToday(date)) return "Today";
  if (dateFnsIsTomorrow(date)) return "Tomorrow";

  // Return formatted date (e.g., "Jan 15" or "Jan 15, 2025" if not this year)
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return format(date, isThisYear ? "MMM d" : "MMM d, yyyy");
}

/**
 * Calculate days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  return differenceInDays(new Date(dueDate), new Date());
}

// =====================================================
// TASK STATUS & PRIORITY HELPERS
// =====================================================

/**
 * Get color class for task status
 */
export function getTaskStatusColor(status: Task["status"]): string {
  return STATUS_CONFIG[status]?.color || STATUS_CONFIG.todo.color;
}

/**
 * Get background color class for task status
 */
export function getTaskStatusBg(status: Task["status"]): string {
  return STATUS_CONFIG[status]?.bg || STATUS_CONFIG.todo.bg;
}

/**
 * Get label for task status
 */
export function getTaskStatusLabel(status: Task["status"]): string {
  return STATUS_CONFIG[status]?.label || "To Do";
}

/**
 * Get color class for task priority
 */
export function getTaskPriorityColor(priority: Task["priority"]): string {
  if (!priority) return PRIORITY_CONFIG.medium.color;
  return PRIORITY_CONFIG[priority]?.color || PRIORITY_CONFIG.medium.color;
}

/**
 * Get background color class for task priority
 */
export function getTaskPriorityBg(priority: Task["priority"]): string {
  if (!priority) return PRIORITY_CONFIG.medium.bg;
  return PRIORITY_CONFIG[priority]?.bg || PRIORITY_CONFIG.medium.bg;
}

/**
 * Get label for task priority
 */
export function getTaskPriorityLabel(priority: Task["priority"]): string {
  if (!priority) return "Medium";
  return PRIORITY_CONFIG[priority]?.label || "Medium";
}

/**
 * Check if a task can be moved to a target section
 */
export function canMoveTask(task: Task, targetSection: BoardSection): boolean {
  // Task must be from the same board
  return task.board_id === targetSection.board_id;
}

// =====================================================
// TASK GROUPING
// =====================================================

/**
 * Group tasks by board
 */
export function groupTasksByBoard(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((acc, task) => {
    const boardKey = task.board_id ?? "inbox";
    if (!acc[boardKey]) {
      acc[boardKey] = [];
    }
    acc[boardKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
}

/**
 * Group tasks by relative date
 * Returns groups like "Overdue", "Today", "Tomorrow", "This Week", "This Month", "Older"
 */
export function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {
    Overdue: [],
    Today: [],
    Tomorrow: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  };

  tasks.forEach((task) => {
    if (!task.due_date && !task.completed_at) {
      groups.Older.push(task);
      return;
    }

    const dateStr = task.completed_at || task.due_date;
    if (!dateStr) {
      groups.Older.push(task);
      return;
    }

    const date = new Date(dateStr);

    if (task.completed_at) {
      // Group completed tasks by completion date
      if (dateFnsIsToday(date)) {
        groups.Today.push(task);
      } else if (isYesterday(date)) {
        if (!groups.Yesterday) groups.Yesterday = [];
        groups.Yesterday.push(task);
      } else if (isThisWeek(date)) {
        groups["This Week"].push(task);
      } else if (isThisMonth(date)) {
        groups["This Month"].push(task);
      } else {
        groups.Older.push(task);
      }
    } else if (task.due_date) {
      // Group active tasks by due date
      if (isOverdue(task.due_date)) {
        groups.Overdue.push(task);
      } else if (dateFnsIsToday(date)) {
        groups.Today.push(task);
      } else if (dateFnsIsTomorrow(date)) {
        groups.Tomorrow.push(task);
      } else if (isThisWeek(date)) {
        groups["This Week"].push(task);
      } else if (isThisMonth(date)) {
        groups["This Month"].push(task);
      } else {
        groups.Older.push(task);
      }
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}

/**
 * Group tasks by status
 */
export function groupTasksByStatus(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
}

// =====================================================
// TASK SORTING
// =====================================================

/**
 * Sort tasks by due date (soonest first, null last)
 */
export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

/**
 * Sort tasks by priority (urgent first, null last)
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  return [...tasks].sort((a, b) => {
    const aPriority = a.priority ? priorityOrder[a.priority] : 4;
    const bPriority = b.priority ? priorityOrder[b.priority] : 4;
    return aPriority - bPriority;
  });
}

/**
 * Sort tasks by display order
 */
export function sortTasksByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.display_order === null && b.display_order === null) return 0;
    if (a.display_order === null) return 1;
    if (b.display_order === null) return -1;
    return a.display_order - b.display_order;
  });
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validate task title
 */
export function validateTaskTitle(title: string): {
  valid: boolean;
  error?: string;
} {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Title is required" };
  }

  if (title.length > 200) {
    return { valid: false, error: "Title must be 200 characters or less" };
  }

  return { valid: true };
}

/**
 * Validate due date
 */
export function validateDueDate(date: string): {
  valid: boolean;
  error?: string;
} {
  if (!date) return { valid: true }; // Due date is optional

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  return { valid: true };
}

/**
 * Validate tag
 */
export function validateTag(tag: string): { valid: boolean; error?: string } {
  if (!tag || tag.trim().length === 0) {
    return { valid: false, error: "Tag cannot be empty" };
  }

  if (tag.length > 30) {
    return { valid: false, error: "Tag must be 30 characters or less" };
  }

  return { valid: true };
}

// =====================================================
// TEMPLATE DETECTION
// =====================================================

/**
 * Check if a task is a job tracker task
 * Detects based on presence of job-specific fields in item_data
 */
export function isJobTrackerTask(task: Task): boolean {
  return (
    task.item_data?.company_name !== undefined ||
    task.item_data?.position !== undefined
  );
}

/**
 * Check if a task is a recipe task
 * Detects based on presence of recipe-specific fields in item_data
 */
export function isRecipeTask(task: Task): boolean {
  return (
    task.item_data?.recipe_name !== undefined ||
    task.item_data?.name !== undefined ||
    task.item_data?.ingredients !== undefined
  );
}
