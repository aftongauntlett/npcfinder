/**
 * Board Template Definitions
 *
 * Defines available board templates with their fields and configurations
 */

export type TemplateType =
  | "job_tracker"
  | "todo"
  | "grocery"
  | "recipe"
  | "notes"
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
      id: "salary_range",
      label: "Salary Range",
      type: "text",
      placeholder: "$100k - $150k",
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
 * Grocery List Template
 */
export const GROCERY_TEMPLATE: BoardTemplate = {
  id: "grocery",
  name: "Grocery List",
  description: "Simple shopping list with easy check-off and sharing",
  icon: "ShoppingCart",
  emoji: "🛒",
  defaultView: "checklist",
  fields: [
    {
      id: "item_name",
      label: "Item",
      type: "text",
      required: true,
      placeholder: "Milk, eggs, bread...",
    },
    {
      id: "quantity",
      label: "Quantity",
      type: "text",
      placeholder: "2 lbs, 1 dozen, etc.",
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      options: [
        "Produce",
        "Dairy",
        "Meat",
        "Bakery",
        "Pantry",
        "Frozen",
        "Beverages",
        "Snacks",
        "Household",
        "Other",
      ],
    },
  ],
  statusOptions: ["Need", "Got It"],
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
 * Quick Notes Template
 */
export const NOTES_TEMPLATE: BoardTemplate = {
  id: "notes",
  name: "Quick Notes",
  description: "Fast, simple note-taking for ideas and reminders",
  icon: "StickyNote",
  emoji: "📝",
  defaultView: "list",
  fields: [
    {
      id: "note_title",
      label: "Title",
      type: "text",
      required: true,
      placeholder: "Note title...",
    },
    {
      id: "content",
      label: "Content",
      type: "textarea",
      placeholder: "Start typing...",
    },
    {
      id: "tags",
      label: "Tags",
      type: "text",
      placeholder: "work, personal, idea",
    },
  ],
  statusOptions: ["Active", "Archived"],
};

/**
 * To-Do List Template
 */
export const TODO_TEMPLATE: BoardTemplate = {
  id: "todo",
  name: "To-Do List",
  description: "Simple task list to track what you need to get done",
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
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Additional details...",
    },
  ],
  statusOptions: ["To Do", "Done"],
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
  todo: TODO_TEMPLATE,
  grocery: GROCERY_TEMPLATE,
  recipe: RECIPE_TEMPLATE,
  notes: NOTES_TEMPLATE,
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
