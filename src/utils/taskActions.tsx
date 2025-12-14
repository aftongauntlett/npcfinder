/**
 * Task Action Button Helpers
 * Generates standardized action button configurations for task cards
 */

import {
  CheckIcon as Check,
  ClockIcon as Clock,
  XIcon as X,
} from "@phosphor-icons/react";

export interface TaskActionCallbacks {
  onRemove?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onSnooze?: (taskId: string) => void;
}

export function generateTaskActions(
  taskId: string,
  callbacks: TaskActionCallbacks
) {
  const actions = [];

  if (callbacks.onRemove) {
    actions.push({
      id: "remove",
      icon: <X size={18} weight="bold" />,
      label: "Remove",
      onClick: () => callbacks.onRemove!(taskId),
      variant: "danger" as const,
      tooltip: "Delete task",
    });
  }

  if (callbacks.onToggleComplete) {
    actions.push({
      id: "complete",
      icon: <Check size={18} weight="bold" />,
      label: "Mark as complete",
      onClick: () => callbacks.onToggleComplete!(taskId),
      variant: "success" as const,
      tooltip: "Mark as complete",
    });
  }

  if (callbacks.onSnooze) {
    actions.push({
      id: "snooze",
      icon: <Clock size={18} weight="duotone" />,
      label: "Snooze",
      onClick: () => callbacks.onSnooze!(taskId),
      variant: "warning" as const,
      tooltip: "Snooze until tomorrow",
    });
  }

  return actions;
}
