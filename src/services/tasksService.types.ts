/**
 * Type definitions for Tasks service
 *
 * Supports flexible board-based task management:
 * - Boards for organization (Job Search, Daily Tasks, etc.)
 * - Sections within boards (To Do, In Progress, Done)
 * - Rich task metadata (priority, tags, due dates)
 */

/**
 * Status History Entry
 * Tracks the date and status for each status change in job tracker tasks
 */
export interface StatusHistoryEntry {
  status: string;
  date: string; // YYYY-MM-DD format
  notes?: string;
}

/**
 * Board Share
 * Represents sharing a board with another user
 */
export interface BoardShare {
  id: string;
  board_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  shared_with_user_name?: string; // For display purposes
  can_edit: boolean;
  created_at: string;
}

/**
 * Board Share with User Info
 * Includes joined user data from profiles
 */
export interface BoardShareWithUser extends BoardShare {
  shared_with_user: {
    user_id: string;
    display_name: string | null;
  } | null;
}

/**
 * Shared Board Data
 * Result from querying boards shared with current user
 */
export interface SharedBoardData {
  id: string;
  board_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  can_edit: boolean;
  created_at: string;
  board: BoardWithStats;
}

/**
 * Template Type
 * Canonical set of supported board template types
 * Must match database CHECK constraint on task_boards.template_type
 */
export type TemplateType =
  | "job_tracker"
  | "markdown"
  | "recipe"
  | "kanban"
  | "grocery"
  | "custom";

/**
 * Grocery Category
 * Common grocery shopping categories
 */
export type GroceryCategory =
  | "Produce"
  | "Dairy"
  | "Meat"
  | "Bakery"
  | "Pantry"
  | "Frozen"
  | "Beverages"
  | "Snacks"
  | "Other";

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_public: boolean;
  board_type: string | null;
  template_type?: TemplateType | null;
  field_config: Record<string, unknown> | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  shared_with_users?: BoardShare[] | null;
}

export interface BoardSection {
  id: string;
  board_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  board_id: string | null;
  section_id: string | null;
  title: string;
  description: string | null;
  icon?: string | null;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "low" | "medium" | "high" | "urgent" | null;
  due_date: string | null; // ISO date string (YYYY-MM-DD)
  tags: string[] | null;
  item_data?: Record<string, unknown> | null;
  display_order: number | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  // Repeatable task fields
  is_repeatable: boolean | null;
  repeat_frequency: "weekly" | "monthly" | "yearly" | "custom" | null;
  repeat_custom_days: number | null; // For custom frequency (days between repeats)
  last_completed_at: string | null; // Track when last completed for repeatable tasks
  // Timer fields
  timer_duration_minutes: number | null;
  timer_started_at: string | null;
  timer_completed_at: string | null;
  is_urgent_after_timer: boolean | null;
  // Reminder fields
  reminder_date: string | null;
  reminder_time: string | null;
  reminder_sent_at: string | null;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_public?: boolean;
  board_type?: string;
  template_type?: TemplateType;
  field_config?: Record<string, unknown>;
}

export interface CreateSectionData {
  name: string;
  display_order: number;
}

export interface CreateTaskData {
  board_id: string | null;
  section_id?: string;
  title: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  due_date?: string;
  tags?: string[];
  item_data?: Record<string, unknown>;
  is_repeatable?: boolean;
  repeat_frequency?: "weekly" | "monthly" | "yearly" | "custom";
  repeat_custom_days?: number;
  timer_duration_minutes?: number;
  is_urgent_after_timer?: boolean;
  reminder_date?: string;
  reminder_time?: string;
}

export interface TaskFilters {
  status?: Task["status"];
  priority?: Task["priority"];
  tags?: string[];
  dueBefore?: string;
  dueAfter?: string;
  unassigned?: boolean; // Filter for tasks with null board_id
}

export interface BoardWithStats extends Board {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}

/**
 * Admin-specific type for board with user information
 * Used in admin panel to view all users' boards
 */
export interface BoardWithStatsAdmin extends BoardWithStats {
  user_email?: string;
  user_display_name?: string;
}

/**
 * Admin-specific type for task with user and board information
 * Used in admin panel to view all users' tasks
 */
export interface TaskAdmin extends Task {
  user_email?: string;
  user_display_name?: string;
  board_title?: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}
