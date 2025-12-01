/**
 * Type definitions for Tasks service
 *
 * Supports flexible board-based task management:
 * - Boards for organization (Job Search, Daily Tasks, etc.)
 * - Sections within boards (To Do, In Progress, Done)
 * - Rich task metadata (priority, tags, due dates)
 */

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_public: boolean;
  board_type: string | null;
  template_type?: string | null;
  field_config: Record<string, unknown> | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
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
}

export interface CreateBoardData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_public?: boolean;
  board_type?: string;
  template_type?: string;
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

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}
