/**
 * Helper functions for repeatable tasks
 */

/**
 * Calculate the next due date for a repeatable task
 */
export function getNextDueDate(
  currentDueDate: string,
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
): string {
  const current = new Date(currentDueDate);

  switch (frequency) {
    case "daily":
      current.setDate(current.getDate() + 1);
      break;
    case "weekly":
      current.setDate(current.getDate() + 7);
      break;
    case "biweekly":
      current.setDate(current.getDate() + 14);
      break;
    case "monthly":
      current.setMonth(current.getMonth() + 1);
      break;
    case "yearly":
      current.setFullYear(current.getFullYear() + 1);
      break;
  }

  return current.toISOString().split("T")[0];
}

/**
 * Check if a task is overdue by more than 7 days
 */
export function isSevenDaysOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysDiff >= 7;
}
