/**
 * Constants for the Tasks feature
 * Defines task statuses, priorities, default sections, and limits
 */

// Task statuses
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  ARCHIVED: "archived",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// Task priorities
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

// Default board sections
export const DEFAULT_BOARD_SECTIONS = [
  { name: "To Do", order: 0 },
  { name: "In Progress", order: 1 },
  { name: "Done", order: 2 },
] as const;

// Board types
export const BOARD_TYPES = {
  KANBAN: "kanban",
  LIST: "list",
  CALENDAR: "calendar",
} as const;

export type BoardType = (typeof BOARD_TYPES)[keyof typeof BOARD_TYPES];

// Icon options for boards (lucide-react icon names)
export const BOARD_ICONS = [
  "briefcase", // Job Search
  "clipboard-list", // Daily Tasks
  "utensils", // Recipes
  "dumbbell", // Fitness
  "book", // Reading
  "code", // Projects
  "shopping-cart", // Shopping
  "plane", // Travel
  "heart", // Health
  "dollar-sign", // Finance
  "target", // Goals
  "calendar", // Planning
] as const;

// Color options for boards
export const BOARD_COLORS = [
  "#9333ea", // Purple (default)
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#6366f1", // Indigo
] as const;

// Task limits
export const TASK_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TAGS_PER_TASK: 10,
  MAX_TAG_LENGTH: 30,
  MAX_BOARDS_PER_USER: 50,
  MAX_SECTIONS_PER_BOARD: 20,
  MAX_TASKS_PER_BOARD: 500,
  MAX_TIMER_MINUTES: 1440, // 24 hours
  MIN_TIMER_MINUTES: 1,
  MAX_REMINDER_DAYS_AHEAD: 365, // 1 year
} as const;

// Priority labels and colors
export const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    color: "text-green-600 dark:text-green-300",
    bg: "bg-green-100/60 dark:bg-green-900/20",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600 dark:text-blue-300",
    bg: "bg-blue-100/60 dark:bg-blue-900/20",
  },
  high: {
    label: "High",
    color: "text-orange-600 dark:text-orange-300",
    bg: "bg-orange-100/60 dark:bg-orange-900/20",
  },
  urgent: {
    label: "Urgent",
    color: "text-red-600 dark:text-red-300",
    bg: "bg-red-100/60 dark:bg-red-900/20",
  },
} as const;

// Status labels and colors
export const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  done: {
    label: "Done",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  archived: {
    label: "Archived",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
} as const;

// Priority options for forms
export const PRIORITY_OPTIONS = [
  { value: "low" as const, ...PRIORITY_CONFIG.low },
  { value: "medium" as const, ...PRIORITY_CONFIG.medium },
  { value: "high" as const, ...PRIORITY_CONFIG.high },
] as const;

// Status options for forms
export const STATUS_OPTIONS = [
  { value: "todo" as const, ...STATUS_CONFIG.todo },
  { value: "in_progress" as const, ...STATUS_CONFIG.in_progress },
  { value: "done" as const, ...STATUS_CONFIG.done },
  { value: "archived" as const, ...STATUS_CONFIG.archived },
] as const;

/**
 * Grocery Categories
 */
export const GROCERY_CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Bakery",
  "Pantry",
  "Frozen",
  "Beverages",
  "Snacks",
  "Other",
] as const;

/**
 * Category Colors for Grocery Items
 */
export const CATEGORY_COLORS = {
  Produce: {
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-300 dark:border-green-700",
  },
  Dairy: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
  },
  Meat: {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
  },
  Bakery: {
    bg: "bg-amber-100 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
  },
  Pantry: {
    bg: "bg-yellow-100 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  Frozen: {
    bg: "bg-cyan-100 dark:bg-cyan-900/20",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-300 dark:border-cyan-700",
  },
  Beverages: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
  },
  Snacks: {
    bg: "bg-pink-100 dark:bg-pink-900/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-300 dark:border-pink-700",
  },
  Other: {
    bg: "bg-gray-100 dark:bg-gray-900/20",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
  },
} as const;

/**
 * Timer Status Constants
 */
export const TIMER_STATUS = {
  NOT_STARTED: "not_started",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
} as const;

export type TimerStatus = (typeof TIMER_STATUS)[keyof typeof TIMER_STATUS];

/**
 * Reminder Type Constants
 */
export const REMINDER_TYPE = {
  DATE_BASED: "date_based",
  TIMER_BASED: "timer_based",
} as const;

export type ReminderType = (typeof REMINDER_TYPE)[keyof typeof REMINDER_TYPE];
