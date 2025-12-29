/**
 * TaskCard Component
 *
 * Reusable card component for displaying individual tasks in various contexts
 * Supports multiple variants: compact, detailed, and kanban
 * Features accordion-style expand/collapse for description
 *
 * Memoized: Rendered in lists of 50+ cards, prevents rerenders when task props unchanged
 */

import React, { useMemo, useCallback } from "react";
import {
  CalendarIcon as Calendar,
  ArrowsClockwiseIcon as ArrowsClockwise,
  CheckIcon as Check,
} from "@phosphor-icons/react";
import { ListTodo } from "lucide-react";
import ActionButtonGroup from "../shared/common/ActionButtonGroup";
import AccordionListCard from "../shared/common/AccordionListCard";
import TimerWidget from "./TimerWidget";
import Button from "../shared/ui/Button";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useCompleteRepeatableTask } from "../../hooks/useTasksQueries";
import { formatShortDate } from "../../utils/dateFormatting";
import type { Task } from "../../services/tasksService.types";
import { withOpacity } from "../../data/landingTheme";
import { getTaskIconOptionByName } from "../../utils/taskIcons";
import {
  formatDueDate,
  isOverdue,
  isRepeatableTaskOverdue,
  getDueDateChipColor,
} from "../../utils/taskHelpers";
import { generateTaskActions } from "../../utils/taskActions";

interface TaskCardProps {
  task: Task;
  variant?: "compact" | "detailed" | "kanban";
  onToggleComplete?: (taskId: string) => void;
  onSnooze?: (taskId: string) => void;
  onRemove?: (taskId: string, boardId: string | null) => void;
  onClick?: (taskId: string) => void;
  draggable?: boolean;
  onExpandChange?: (isExpanded: boolean) => void;
}

const TaskCardComponent: React.FC<TaskCardProps> = ({
  task,
  variant = "detailed",
  onToggleComplete,
  onSnooze,
  onRemove,
  onClick,
  draggable = false,
  onExpandChange,
}) => {
  const overdue = isOverdue(task.due_date);
  const repeatableOverdue = isRepeatableTaskOverdue(task);
  const isMobile = useIsMobile();
  const completeRepeatable = useCompleteRepeatableTask();

  const taskIconOption = useMemo(
    () => getTaskIconOptionByName(task.icon),
    [task.icon]
  );
  const TaskIcon = taskIconOption?.icon ?? ListTodo;
  const isLucideTaskIcon = taskIconOption == null;
  const iconColor = task.icon_color ?? undefined;
  const iconContainerStyle = useMemo(() => {
    if (!iconColor) return undefined;
    return {
      backgroundColor: withOpacity(iconColor, 0.14),
    } as React.CSSProperties;
  }, [iconColor]);
  const iconStyle = useMemo(() => {
    if (!iconColor) return undefined;
    return { color: iconColor } as React.CSSProperties;
  }, [iconColor]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't toggle if clicking action buttons in dropdown
      if (target.closest("[data-action-buttons]")) {
        return;
      }

      // For non-detailed variants, trigger onClick callback
      if (onClick && variant !== "detailed") {
        onClick(task.id);
      }
    },
    [onClick, variant, task.id]
  );

  // Generate action buttons once for reuse - memoized to prevent recreation
  const actionButtons = useMemo(
    () =>
      generateTaskActions(
        task.id,
        {
          onRemove,
          onToggleComplete,
          onSnooze,
        },
        task.board_id
      ),
    [task.id, task.board_id, onRemove, onToggleComplete, onSnooze]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't activate card if pressing Enter/Space on action buttons
      if (target.closest("[data-action-buttons]")) {
        return;
      }

      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick(task.id);
      }
    },
    [onClick, task.id]
  );

  // Compact variant - minimal for lists
  if (variant === "compact") {
    return (
      <div
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        className={`flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors ${
          onClick
            ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            : ""
        }`}
      >
        {TaskIcon && (
          <span
            className="icon-container-sm"
            style={iconContainerStyle}
            aria-hidden="true"
          >
            {isLucideTaskIcon ? (
              <TaskIcon className="w-4 h-4" style={iconStyle} />
            ) : (
              <TaskIcon
                className="w-4 h-4"
                weight="regular"
                style={iconStyle}
              />
            )}
          </span>
        )}
        <span className="flex-1 text-sm text-gray-900 dark:text-white">
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
        <ActionButtonGroup actions={actionButtons} spacing="tight" />
      </div>
    );
  }

  // Kanban variant - optimized for board view
  if (variant === "kanban") {
    return (
      <div
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-900/[0.04] dark:hover:bg-gray-900 p-4 ${
          onClick
            ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            : ""
        } ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${
          overdue ? "border-l-4 border-l-red-500" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <h4 className="text-sm font-medium flex-1 text-gray-900 dark:text-white min-w-0">
              {task.title}
            </h4>
          </div>

          {/* Action buttons - always visible on mobile, shown on hover on desktop */}
          <div
            className={`${
              isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}
          >
            <ActionButtonGroup actions={actionButtons} spacing="tight" />
          </div>
        </div>

        {/* Task metadata */}
        <div className="flex flex-wrap gap-2">
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${getDueDateChipColor(
                task.due_date
              )}`}
            >
              <Calendar className="w-3 h-3" />
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Detailed variant - full info for Today view and Archive

  // Build header content following Movies/Recipes/JobCard pattern
  const headerChips: Array<{ key: string; node: React.ReactNode }> = [];

  if (task.due_date) {
    headerChips.push({
      key: "due_date",
      node: (
        <span className={`chip-base ${getDueDateChipColor(task.due_date)}`}>
          <Calendar className="w-3.5 h-3.5" />
          {formatDueDate(task.due_date)}
        </span>
      ),
    });
  }

  if (task.is_repeatable && task.repeat_frequency) {
    headerChips.push({
      key: "repeat",
      node: (
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
          title={`Repeats ${task.repeat_frequency}`}
        >
          <ArrowsClockwise className="w-4 h-4" weight="bold" />
        </span>
      ),
    });
  }

  const headerContent = (
    <div className="flex items-start gap-3">
      {/* Icon */}
      {TaskIcon && (
        <span
          className="icon-container-lg flex-shrink-0"
          style={iconContainerStyle}
          aria-hidden="true"
        >
          {isLucideTaskIcon ? (
            <TaskIcon className="w-5 h-5" style={iconStyle} />
          ) : (
            <TaskIcon className="w-5 h-5" weight="regular" style={iconStyle} />
          )}
        </span>
      )}

      {/* Title and Chips */}
      <div className="flex-1 min-w-0">
        {/* Title row with badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {task.title}
          </h3>
          {/* Chips (collapsed on mobile: show 1 + +n) */}
          {headerChips.length > 0 && (
            <>
              <div className="flex items-center gap-2 flex-wrap sm:hidden">
                <React.Fragment key={headerChips[0].key}>
                  {headerChips[0].node}
                </React.Fragment>
                {headerChips.length > 1 && (
                  <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    +{headerChips.length - 1}
                  </span>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {headerChips.map((chip) => (
                  <React.Fragment key={chip.key}>{chip.node}</React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Description - muted text under title (show only first line) */}
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
            {task.description.split("\n")[0]}
          </p>
        )}
      </div>
    </div>
  );

  // Status section component - only for tasks with due dates that are due/overdue
  const today = new Date().toISOString().split("T")[0];
  const isDueToday = task.due_date === today;
  const shouldShowStatus =
    onToggleComplete &&
    ((task.is_repeatable && repeatableOverdue) ||
      (task.due_date && (overdue || isDueToday)));

  const statusSection = shouldShowStatus && (
    <div>
      <h4 className="section-title">Status</h4>
      {task.is_repeatable && repeatableOverdue ? (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Mark this cycle as complete to reset the schedule.
          </p>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              void completeRepeatable.mutateAsync(task.id);
            }}
            disabled={completeRepeatable.isPending}
            variant="secondary"
            size="sm"
            icon={<Check size={16} weight="bold" />}
            iconPosition="left"
          >
            {completeRepeatable.isPending ? "Completing..." : "Mark Complete"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Mark this task as complete.
          </p>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log(
                "[TaskCard] Mark Complete clicked for task:",
                task.id,
                "status:",
                task.status
              );
              if (onToggleComplete) {
                onToggleComplete(task.id);
              }
            }}
            variant="secondary"
            size="sm"
            icon={<Check size={16} weight="bold" />}
            iconPosition="left"
          >
            Mark Complete
          </Button>
        </>
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-4">
      {/* Two-column grid: left for details, right for timer (if exists) */}
      {task.timer_duration_seconds ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Task Details + Status (when timer exists) */}
          <div className="space-y-4">
            {/* Full Description */}
            {task.description && (
              <div>
                <h4 className="section-title">Description</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Status section - shown in left column when timer exists */}
            {statusSection}
          </div>

          {/* Right Column: Timer */}
          <div className="flex flex-col justify-start">
            <TimerWidget task={task} compact={false} />
          </div>
        </div>
      ) : (
        /* Two-column layout when no timer: description left, status right */
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Description */}
          {task.description && (
            <div>
              <h4 className="section-title">Description</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Right Column: Status section when no timer */}
          {statusSection && (
            <div className="flex flex-col justify-start">{statusSection}</div>
          )}
        </div>
      )}

      {/* Timestamps footer - matches RecipeCard/JobCard/MediaListItem */}
      <div className="text-xs text-gray-500 dark:text-gray-400 pt-4">
        Created {formatShortDate(task.created_at)}
        {task.updated_at !== task.created_at && (
          <>
            {" • "}
            Updated {formatShortDate(task.updated_at)}
          </>
        )}
      </div>
    </div>
  );

  // Custom actions - only for tasks with due dates that are due/overdue
  const customActions = [];
  if (onToggleComplete && shouldShowStatus) {
    if (task.is_repeatable && repeatableOverdue) {
      customActions.push({
        label: "Complete cycle",
        icon: <Check size={16} weight="bold" />,
        onClick: () => {
          void completeRepeatable.mutateAsync(task.id);
        },
        variant: "action" as const,
        ariaLabel: "Mark this cycle complete",
        className:
          "!bg-green-100 dark:!bg-green-900/30 !text-green-700 dark:!text-green-400 hover:!bg-green-200 dark:hover:!bg-green-900/50",
      });
    } else {
      customActions.push({
        label: "Complete",
        icon: <Check size={16} weight="bold" />,
        onClick: () => onToggleComplete(task.id),
        variant: "action" as const,
        ariaLabel: "Mark task complete",
        className:
          "!bg-green-100 dark:!bg-green-900/30 !text-green-700 dark:!text-green-400 hover:!bg-green-200 dark:hover:!bg-green-900/50",
      });
    }
  }

  return (
    <AccordionListCard
      onEdit={() => onClick?.(task.id)}
      onDelete={() => onRemove?.(task.id, task.board_id)}
      expandedContent={expandedContent}
      onClick={isMobile && onClick ? () => onClick(task.id) : undefined}
      onExpandChange={onExpandChange}
      customActions={customActions.length > 0 ? customActions : undefined}
    >
      {headerContent}
    </AccordionListCard>
  );
};

// Memoize with custom comparison to prevent rerenders when key task properties unchanged
export default React.memo(
  TaskCardComponent,
  (prevProps, nextProps) =>
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.icon === nextProps.task.icon &&
    prevProps.task.icon_color === nextProps.task.icon_color &&
    prevProps.task.due_date === nextProps.task.due_date &&
    prevProps.task.updated_at === nextProps.task.updated_at &&
    prevProps.task.timer_started_at === nextProps.task.timer_started_at &&
    prevProps.task.timer_completed_at === nextProps.task.timer_completed_at &&
    prevProps.task.timer_duration_seconds ===
      nextProps.task.timer_duration_seconds &&
    prevProps.variant === nextProps.variant &&
    prevProps.draggable === nextProps.draggable &&
    prevProps.onToggleComplete === nextProps.onToggleComplete &&
    prevProps.onSnooze === nextProps.onSnooze &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onClick === nextProps.onClick
);
