/**
 * Timer Helper Functions
 *
 * Utilities for managing task timers
 */

import type { Task } from "../services/tasksService.types";
import { TIMER_STATUS, type TimerStatus } from "./taskConstants";

/**
 * Calculate remaining time in seconds for a timer
 * Returns 0 if timer has expired
 */
export function calculateRemainingTime(
  startedAt: string,
  durationSeconds: number
): number {
  const startTime = new Date(startedAt).getTime();
  const now = Date.now();
  const durationMs = durationSeconds * 1000;
  const elapsed = now - startTime;
  const remaining = durationMs - elapsed;

  return remaining > 0 ? Math.floor(remaining / 1000) : 0;
}

/**
 * Format timer duration from seconds to HH:MM:SS or MM:SS
 */
export function formatTimerDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Get the current status of a task timer
 * 
 * NOTE: Pause is now handled entirely in the frontend as local UI state.
 * The database only tracks: timer_duration_seconds, timer_started_at, timer_completed_at
 */
export function getTimerStatus(task: Task): TimerStatus {
  if (!task.timer_started_at) {
    return TIMER_STATUS.NOT_STARTED;
  }

  // Check if timer has been marked as completed
  if (task.timer_completed_at) {
    return TIMER_STATUS.COMPLETED;
  }

  // Check if timer has naturally expired (reached zero)
  if (
    task.timer_duration_seconds &&
    calculateRemainingTime(
      task.timer_started_at,
      task.timer_duration_seconds
    ) === 0
  ) {
    return TIMER_STATUS.COMPLETED;
  }

  return TIMER_STATUS.RUNNING;
}

/**
 * Check if a timer has expired
 */
export function isTimerExpired(
  startedAt: string,
  durationSeconds: number
): boolean {
  return calculateRemainingTime(startedAt, durationSeconds) === 0;
}

/**
 * Calculate timer progress as a percentage (0-100)
 */
export function getTimerProgress(
  startedAt: string,
  durationSeconds: number
): number {
  const startTime = new Date(startedAt).getTime();
  const now = Date.now();
  const durationMs = durationSeconds * 1000;
  const elapsed = now - startTime;

  const progress = Math.min((elapsed / durationMs) * 100, 100);
  return Math.max(progress, 0);
}

/**
 * Get color class based on timer progress
 * Returns Tailwind color classes
 */
export function getTimerColor(progress: number): {
  bg: string;
  text: string;
} {
  if (progress < 50) {
    return {
      bg: "bg-green-100 dark:bg-green-900/20",
      text: "text-green-700 dark:text-green-300",
    };
  }
  if (progress < 80) {
    return {
      bg: "bg-yellow-100 dark:bg-yellow-900/20",
      text: "text-yellow-700 dark:text-yellow-300",
    };
  }
  return {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
  };
}
