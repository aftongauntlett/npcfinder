/**
 * Reminder Helper Functions
 *
 * Utilities for managing task reminders
 */

import type { Task } from "../services/tasksService.types";

/**
 * Check if a reminder is within the next N days
 */
export function isReminderUpcoming(
  reminderDate: string,
  daysAhead: number
): boolean {
  const reminder = new Date(reminderDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  futureDate.setHours(23, 59, 59, 999);

  return reminder >= today && reminder <= futureDate;
}

/**
 * Format reminder date and time for display
 * Uses relative dates for nearby reminders
 */
export function formatReminderDate(
  reminderDate: string,
  reminderTime?: string | null
): string {
  const date = new Date(reminderDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Calculate days difference
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let dateStr = "";

  if (diffDays === 0) {
    dateStr = "Today";
  } else if (diffDays === 1) {
    dateStr = "Tomorrow";
  } else if (diffDays > 1 && diffDays <= 7) {
    dateStr = `In ${diffDays} days`;
  } else {
    // Format as MMM DD, YYYY
    dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }

  // Add time if provided
  if (reminderTime) {
    const [hours, minutes] = reminderTime.split(":");
    const timeDate = new Date();
    timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    const timeStr = timeDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  }

  return dateStr;
}

/**
 * Get badge color based on how soon the reminder is
 */
export function getReminderBadgeColor(reminderDate: string): {
  bg: string;
  text: string;
} {
  const date = new Date(reminderDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - red
    return {
      bg: "bg-red-100 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-300",
    };
  }
  if (diffDays <= 3) {
    // Next 3 days - orange
    return {
      bg: "bg-orange-100 dark:bg-orange-900/20",
      text: "text-orange-700 dark:text-orange-300",
    };
  }
  if (diffDays <= 7) {
    // This week - yellow
    return {
      bg: "bg-yellow-100 dark:bg-yellow-900/20",
      text: "text-yellow-700 dark:text-yellow-300",
    };
  }

  // Later - blue
  return {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
  };
}

/**
 * Check if a reminder should be sent now
 * Based on reminder date, time, and whether it's already been sent
 */
export function shouldSendReminder(task: Task): boolean {
  if (!task.reminder_date || task.reminder_sent_at) {
    return false;
  }

  const reminderDate = new Date(task.reminder_date);
  const now = new Date();

  // If no time specified, trigger at midnight on the reminder date
  if (!task.reminder_time) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminder = new Date(task.reminder_date);
    reminder.setHours(0, 0, 0, 0);
    return reminder.getTime() === today.getTime();
  }

  // Combine date and time
  const [hours, minutes] = task.reminder_time.split(":");
  reminderDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  // Check if current time is past reminder time
  return now >= reminderDate;
}

/**
 * Calculate the next occurrence of a yearly reminder (e.g., birthdays)
 * Handles leap years
 */
export function getNextBirthday(reminderDate: string): string {
  const date = new Date(reminderDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the current year's occurrence
  const thisYear = new Date(
    today.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  // If it's already passed this year, get next year's
  if (thisYear < today) {
    const nextYear = new Date(
      today.getFullYear() + 1,
      date.getMonth(),
      date.getDate()
    );
    return nextYear.toISOString().split("T")[0];
  }

  return thisYear.toISOString().split("T")[0];
}

/**
 * Get days until reminder
 */
export function getDaysUntilReminder(reminderDate: string): number {
  const reminder = new Date(reminderDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reminder.setHours(0, 0, 0, 0);

  const diffTime = reminder.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
