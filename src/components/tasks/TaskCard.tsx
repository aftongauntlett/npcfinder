/**
 * TaskCard Component
 *
 * Reusable card component for displaying individual tasks in various contexts
 * Supports multiple variants: compact, detailed, and kanban
 * Features accordion-style expand/collapse for description
 */

import React from "react";
import { Calendar, Flag } from "@phosphor-icons/react";
import ActionButtonGroup from "../shared/common/ActionButtonGroup";
import AccordionCard from "../shared/common/AccordionCard";
import { useIsMobile } from "../../hooks/useIsMobile";
import type { Task } from "../../services/tasksService.types";
import {
  formatDueDate,
  isOverdue,
  getTaskPriorityColor,
  getTaskPriorityBg,
  getTaskPriorityLabel,
} from "../../utils/taskHelpers";
import { isSevenDaysOverdue } from "../../utils/repeatableTaskHelpers";
import { generateTaskActions } from "../../utils/taskActions";

interface TaskCardProps {
  task: Task;
  variant?: "compact" | "detailed" | "kanban";
  onToggleComplete?: (taskId: string) => void;
  onSnooze?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
  draggable?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  variant = "detailed",
  onToggleComplete,
  onSnooze,
  onRemove,
  onClick,
  draggable = false,
}) => {
  const isDone = task.status === "done";
  const overdue = isOverdue(task.due_date);
  const severelyOverdue = isSevenDaysOverdue(task.due_date);
  const isMobile = useIsMobile();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't toggle if clicking action buttons in dropdown
    if (target.closest("[data-action-buttons]")) {
      return;
    }

    // For non-detailed variants, trigger onClick callback
    if (onClick && variant !== "detailed") {
      onClick(task.id);
    }
  };

  // Generate action buttons once for reuse
  const actionButtons = generateTaskActions(task.id, {
    onRemove,
    onToggleComplete,
    onSnooze,
  });

  // Compact variant - minimal for lists
  if (variant === "compact") {
    return (
      <div
        onClick={handleCardClick}
        className={`flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        <span
          className={`flex-1 text-sm ${
            isDone
              ? "line-through text-gray-500 dark:text-gray-400"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {task.title}
        </span>
        {task.due_date && (
          <span
            className={`text-xs ${
              overdue
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {formatDueDate(task.due_date)}
          </span>
        )}
        {/* Action buttons */}
        <ActionButtonGroup actions={actionButtons} size="sm" spacing="tight" />
      </div>
    );
  }

  // Kanban variant - optimized for board view
  if (variant === "kanban") {
    return (
      <div
        onClick={handleCardClick}
        className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-900/[0.04] dark:hover:bg-gray-900 p-4 ${
          onClick ? "cursor-pointer" : ""
        } ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${
          overdue ? "border-l-4 border-l-red-500" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4
            className={`text-sm font-medium flex-1 ${
              isDone
                ? "line-through text-gray-500 dark:text-gray-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {task.title}
          </h4>

          {/* Action buttons - always visible on mobile, shown on hover on desktop */}
          <div
            className={`${
              isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}
          >
            <ActionButtonGroup
              actions={actionButtons}
              size="sm"
              spacing="tight"
            />
          </div>
        </div>

        {/* Task metadata */}
        <div className="flex flex-wrap gap-2">
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                overdue
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {formatDueDate(task.due_date)}
            </span>
          )}

          {task.priority && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${getTaskPriorityBg(
                task.priority
              )} ${getTaskPriorityColor(task.priority)}`}
            >
              <Flag className="w-3 h-3" />
              {getTaskPriorityLabel(task.priority)}
            </span>
          )}

          {/* TODO: Tags hidden from UI but kept in DB - may add back later with better UX */}
        </div>
      </div>
    );
  }

  // Detailed variant - full info for Today view and Archive with glass-morphism design
  const priorityBadge = task.priority ? (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0 ${getTaskPriorityBg(
        task.priority
      )} ${getTaskPriorityColor(task.priority)}`}
    >
      <Flag className="w-3 h-3" />
      {getTaskPriorityLabel(task.priority)}
    </span>
  ) : undefined;

  const overdueBadge = severelyOverdue ? (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0 bg-red-500/90 text-white border border-red-600">
      ⚠️ Overdue
    </span>
  ) : undefined;

  const badges = (
    <>
      {overdueBadge}
      {priorityBadge}
    </>
  );

  const expandedContent = (
    <>
      {/* Due Date */}
      {/* TODO: Tags removed from UI but kept in DB - may add back later with better UX */}
      {task.due_date ? (
        <div className="flex items-center justify-end gap-3">
          {/* Due Date - right aligned */}
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                overdue
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-white/5 text-gray-300 border border-white/10"
              }`}
            >
              <Calendar className="w-3 h-3" />
              Due {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      ) : null}
    </>
  );

  return (
    <AccordionCard
      metadata={badges}
      title={task.title}
      description={task.description || undefined}
      expandedContent={expandedContent}
      onEdit={() => onClick?.(task.id)}
      onDelete={() => onRemove?.(task.id)}
      onClick={isMobile && onClick ? () => onClick(task.id) : undefined}
      className={isDone ? "opacity-60" : ""}
    />
  );
};

export default TaskCard;
