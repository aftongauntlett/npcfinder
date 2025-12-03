/**
 * Board Template Definitions
 *
 * Defines available board templates with their fields and configurations
 */

export type TemplateType =
  | "job_tracker"
  | "markdown"
  | "recipe"
  | "kanban"
  | "custom";

export type ViewType = "table" | "checklist" | "cards" | "kanban" | "list";

export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "url" | "date" | "number" | "select" | "textarea" | "currency";
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  defaultValue?: string | number | Date;
  autoFill?: boolean; // Auto-fill with current date, etc.
}

export interface BoardTemplate {
  id: TemplateType;
  name: string;
  description: string;
  icon: string;
  emoji: string;
  defaultView: ViewType;
  fields: TemplateField[];
  statusOptions?: string[]; // Custom status options for this template
}

/**
 * Job Application Tracker Template
 *
 * The item_data field for job tracker tasks includes:
 * - status_history: Array of StatusHistoryEntry objects tracking each status change
 *   - Each entry contains: { status: string, date: string (YYYY-MM-DD), notes?: string }
 *   - The first entry represents the initial application
 *   - New entries are appended when status changes
 * - date_applied: The date of initial application (also tracked in status_history)
 */
export const JOB_TRACKER_TEMPLATE: BoardTemplate = {
  id: "job_tracker",
  name: "Job Applications",
  description:
    "Track your job search progress with company details and application status",
  icon: "Briefcase",
  emoji: "💼",
  defaultView: "table",
  fields: [
    {
      id: "company_name",
      label: "Company",
      type: "text",
      required: true,
      placeholder: "Company name",
    },
    {
      id: "company_url",
      label: "URL",
      type: "url",
      placeholder: "https://company.com/careers/job-id",
    },
    {
      id: "position",
      label: "Position",
      type: "text",
      placeholder: "Software Engineer",
    },
    {
      id: "location",
      label: "Location",
      type: "text",
      placeholder: "City, State or Remote",
    },
    {
      id: "location_type",
      label: "Work Location",
      type: "select",
      options: ["Remote", "Hybrid", "In-Office"],
      placeholder: "Select work location type",
    },
    {
      id: "salary_range",
      label: "Salary Range",
      type: "text",
      placeholder: "$100k - $150k",
    },
    {
      id: "employment_type",
      label: "Employment Type",
      type: "select",
      options: ["Full-time", "Part-time", "Contract", "Internship"],
      placeholder: "Select employment type",
    },
    {
      id: "date_applied",
      label: "Date Applied",
      type: "date",
      autoFill: true,
      defaultValue: new Date(),
    },
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Interview notes, contacts, etc.",
    },
  ],
  statusOptions: [
    "Applied",
    "Phone Screen",
    "Interview - Round 1",
    "Interview - Round 2",
    "Interview - Round 3",
    "Offer Received",
    "Rejected",
    "No Response",
    "Accepted",
    "Declined",
  ],
};

/**
 * Markdown To-Do List Template
 */
export const MARKDOWN_TODO_TEMPLATE: BoardTemplate = {
  id: "markdown",
  name: "To-Do List",
  description:
    "Markdown-style list with support for bold, bullets, and formatting",
  icon: "ListTodo",
  emoji: "✅",
  defaultView: "list",
  fields: [
    {
      id: "task_title",
      label: "Task",
      type: "text",
      required: true,
      placeholder: "What do you need to do?",
    },
    {
      id: "content",
      label: "Details",
      type: "textarea",
      placeholder: "Use markdown: **bold**, - bullets, etc.",
    },
  ],
  statusOptions: ["To Do", "In Progress", "Done"],
};

/**
 * Recipe Collection Template
 */
export const RECIPE_TEMPLATE: BoardTemplate = {
  id: "recipe",
  name: "Recipe Collection",
  description: "Save and organize your favorite recipes",
  icon: "ChefHat",
  emoji: "🍳",
  defaultView: "cards",
  fields: [
    {
      id: "recipe_name",
      label: "Recipe Name",
      type: "text",
      required: true,
      placeholder: "Chocolate Chip Cookies",
    },
    {
      id: "recipe_url",
      label: "Source URL",
      type: "url",
      placeholder: "https://recipe-site.com/...",
    },
    {
      id: "prep_time",
      label: "Prep Time",
      type: "text",
      placeholder: "15 minutes",
    },
    {
      id: "cook_time",
      label: "Cook Time",
      type: "text",
      placeholder: "30 minutes",
    },
    {
      id: "servings",
      label: "Servings",
      type: "number",
      placeholder: "4",
    },
    {
      id: "ingredients",
      label: "Ingredients",
      type: "textarea",
      placeholder: "List ingredients here...",
    },
    {
      id: "instructions",
      label: "Instructions",
      type: "textarea",
      placeholder: "Step-by-step instructions...",
    },
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Personal notes, modifications, etc.",
    },
  ],
  statusOptions: ["Want to Try", "Made It", "Favorite"],
};

/**
 * Kanban Template (original task board)
 */
export const KANBAN_TEMPLATE: BoardTemplate = {
  id: "kanban",
  name: "Kanban Board",
  description: "Traditional kanban-style task board with columns",
  icon: "LayoutGrid",
  emoji: "📋",
  defaultView: "kanban",
  fields: [
    {
      id: "task_title",
      label: "Task",
      type: "text",
      required: true,
      placeholder: "What needs to be done?",
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Add details...",
    },
    {
      id: "priority",
      label: "Priority",
      type: "select",
      options: ["Low", "Medium", "High"],
    },
    {
      id: "due_date",
      label: "Due Date",
      type: "date",
    },
  ],
  statusOptions: ["To Do", "In Progress", "Done"],
};

/**
 * All available templates
 */
export const BOARD_TEMPLATES: Record<TemplateType, BoardTemplate> = {
  job_tracker: JOB_TRACKER_TEMPLATE,
  markdown: MARKDOWN_TODO_TEMPLATE,
  recipe: RECIPE_TEMPLATE,
  kanban: KANBAN_TEMPLATE,
  custom: {
    id: "custom",
    name: "Custom Board",
    description: "Create your own board with custom fields",
    icon: "Wrench",
    emoji: "🔧",
    defaultView: "list",
    fields: [],
    statusOptions: ["Active", "Completed"],
  },
};

/**
 * Get template by ID
 */
export function getTemplate(templateId: TemplateType): BoardTemplate {
  return BOARD_TEMPLATES[templateId];
}

/**
 * Get all templates as array
 */
export function getAllTemplates(): BoardTemplate[] {
  return Object.values(BOARD_TEMPLATES);
}

/**
 * Get featured templates (exclude custom)
 */
export function getFeaturedTemplates(): BoardTemplate[] {
  return getAllTemplates().filter((t) => t.id !== "custom");
}
