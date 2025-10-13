/**
 * Suggestion statuses with their display properties
 */

export interface SuggestionStatus {
  id: string;
  label: string;
  color: string;
}

export const SUGGESTION_STATUSES: readonly SuggestionStatus[] = [
  {
    id: "new",
    label: "New",
    color:
      "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  },
  {
    id: "considering",
    label: "Considering",
    color:
      "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
  },
  {
    id: "in-progress",
    label: "In Progress",
    color:
      "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  },
  {
    id: "done",
    label: "Done",
    color:
      "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  },
] as const;

export type SuggestionStatusId = (typeof SUGGESTION_STATUSES)[number]["id"];

/**
 * Error codes that indicate database setup is needed
 */
export const DB_SETUP_ERROR_INDICATORS: readonly string[] = [
  "relation",
  "does not exist",
  "not found",
  "could not find",
  "table",
] as const;

export const DB_SETUP_ERROR_CODES: readonly string[] = [
  "42P01",
  "PGRST116",
  "PGRST204",
] as const;
