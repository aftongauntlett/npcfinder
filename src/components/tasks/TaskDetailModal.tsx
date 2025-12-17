/**
 * Task Detail Modal
 * Modal for viewing and editing task details
 * Fetches fresh task data to ensure updates are reflected
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Trash2 } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import { logger } from "@/lib/logger";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import { useTheme } from "../../hooks/useTheme";
import { TASK_ICONS } from "@/utils/taskIcons";
import TaskSchedulingControls from "./partials/TaskSchedulingControls";
import IconSelect from "@/components/shared/common/IconSelect";
import CompactColorThemePicker from "@/components/settings/CompactColorThemePicker";

import JobTaskSection from "./JobTaskSection";
import RecipeTaskSection from "./RecipeTaskSection";
import type { Task } from "../../services/tasksService.types";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useTasks,
} from "../../hooks/useTasksQueries";
import { useTaskFormState } from "../../hooks/tasks/useTaskFormState";
import { isJobTrackerTask, isRecipeTask } from "../../utils/taskHelpers";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task: initialTask,
}) => {
  // Fetch fresh task data when modal opens to ensure we have the latest changes
  const { data: freshTask } = useTask(isOpen ? initialTask.id : null);
  const task = freshTask || initialTask;

  // Use shared form hook for generic task fields
  const {
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    buildBaseUpdates,
  } = useTaskFormState(task);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const { themeColor } = useTheme();

  // Icon + color
  const [icon, setIcon] = useState<string | null>(task.icon ?? null);
  const [iconColor, setIconColor] = useState<string>(
    task.icon_color ?? themeColor
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  // Optional settings disclosure
  const [showOptionalSettings, setShowOptionalSettings] = useState(true);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  useEffect(() => {
    setIcon(task.icon ?? null);
    setIconColor(task.icon_color ?? themeColor);
  }, [task.icon, task.icon_color, themeColor]);

  // Repeatable task state
  const [repeatFrequency, setRepeatFrequency] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >(
    (task.repeat_frequency as
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly") || "weekly"
  );
  const [repeatInterval, setRepeatInterval] = useState<number>(
    task.repeat_interval || 1
  );
  const [isRepeatable, setIsRepeatable] = useState(!!task.is_repeatable);

  // Timer state
  const [hasTimer, setHasTimer] = useState(
    !!task.timer_duration_seconds && task.timer_duration_seconds > 0
  );
  const [timerDuration, setTimerDuration] = useState<number>(
    task.timer_duration_seconds && task.timer_duration_seconds >= 3600
      ? Math.max(1, Math.floor(task.timer_duration_seconds / 3600))
      : task.timer_duration_seconds && task.timer_duration_seconds >= 60
      ? Math.max(1, Math.floor(task.timer_duration_seconds / 60))
      : task.timer_duration_seconds || 30
  );
  const [timerUnit, setTimerUnit] = useState<"minutes" | "hours" | "seconds">(
    task.timer_duration_seconds && task.timer_duration_seconds >= 3600
      ? "hours"
      : task.timer_duration_seconds && task.timer_duration_seconds >= 60
      ? "minutes"
      : "seconds"
  );

  // Fetch existing tasks for duplicate detection (only for job tracker)
  const isJobTracker = isJobTrackerTask(task);
  const { data: existingTasks = [] } = useTasks(
    isJobTracker ? task.board_id ?? undefined : undefined
  );

  // Template-specific item_data builders
  const [jobItemDataBuilder, setJobItemDataBuilder] = useState<
    (() => Record<string, unknown>) | null
  >(null);
  const [recipeItemDataBuilder, setRecipeItemDataBuilder] = useState<
    (() => Record<string, unknown>) | null
  >(null);
  const [isJobValid, setIsJobValid] = useState(true);
  const [isRecipeValid, setIsRecipeValid] = useState(true);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Detect template type using helper functions (declared earlier for useTasks hook)
  const isRecipe = isRecipeTask(task);

  // Callbacks to receive item_data builders from child sections
  const handleJobItemDataBuilder = useCallback(
    (builder: () => Record<string, unknown>, isValid: boolean) => {
      setJobItemDataBuilder(() => builder);
      setIsJobValid(isValid);
    },
    []
  );

  const handleRecipeItemDataBuilder = useCallback(
    (builder: () => Record<string, unknown>, isValid: boolean) => {
      setRecipeItemDataBuilder(() => builder);
      setIsRecipeValid(isValid);
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(null);

    // For job tracker tasks, check for duplicates before updating
    // Mirrors the creation-time checks in CreateTaskModal
    if (isJobTracker && jobItemDataBuilder) {
      const jobData = jobItemDataBuilder();
      const normalizeString = (str: string) => str.toLowerCase().trim();
      const currentCompany = normalizeString(
        (jobData.company_name as string) || ""
      );
      const currentPosition = normalizeString(
        (jobData.position as string) || ""
      );
      const currentUrl = ((jobData.company_url as string) || "").trim();

      for (const existingTask of existingTasks) {
        // Skip comparing with the current task itself
        if (existingTask.id === task.id) continue;

        const taskCompany = normalizeString(
          (existingTask.item_data?.company_name as string) || ""
        );
        const taskPosition = normalizeString(
          (existingTask.item_data?.position as string) || ""
        );
        const taskUrl = (
          (existingTask.item_data?.company_url as string) || ""
        ).trim();

        // Check URL match
        if (currentUrl && taskUrl && currentUrl === taskUrl) {
          setDuplicateError("You've already applied for this role");
          return;
        }

        // Check company + position match
        if (
          currentCompany &&
          taskCompany &&
          currentPosition &&
          taskPosition &&
          currentCompany === taskCompany &&
          currentPosition === taskPosition
        ) {
          setDuplicateError(
            `You already have an application for ${
              jobData.position as string
            } at ${jobData.company_name as string}`
          );
          return;
        }
      }
    }

    // Build base task updates
    const baseUpdates = buildBaseUpdates();

    // Determine template-specific item_data
    let item_data = task.item_data ? { ...task.item_data } : undefined;

    if (isJobTracker && jobItemDataBuilder) {
      item_data = jobItemDataBuilder();
    } else if (isRecipe && recipeItemDataBuilder) {
      // For recipe, also include description from base form
      const recipeData = recipeItemDataBuilder();
      item_data = {
        ...recipeData,
        description: description || "",
      };
    }

    // Determine if repeatable should be enabled (only if toggle is on AND has a due date)
    const shouldEnableRepeatable = isRepeatable && !!dueDate;
    // Determine if timer should be enabled (only if toggle is on AND duration > 0)
    const shouldEnableTimer = hasTimer && timerDuration > 0;

    const updates: Partial<Task> = {
      ...baseUpdates,
      item_data,
      icon: icon || null,
      icon_color: iconColor || null,
      is_repeatable: shouldEnableRepeatable,
      repeat_frequency: shouldEnableRepeatable ? repeatFrequency : null,
      repeat_interval: shouldEnableRepeatable ? repeatInterval : null,
      timer_duration_seconds: shouldEnableTimer
        ? timerUnit === "hours"
          ? timerDuration * 3600
          : timerUnit === "minutes"
          ? timerDuration * 60
          : timerDuration
        : null,
    };

    void updateTask
      .mutateAsync({ taskId: task.id, updates, boardId: task.board_id })
      .then(() => {
        onClose();
      })
      .catch((error) => {
        logger.error("Failed to update task", { error, taskId: task.id });
      });
  };

  const handleDelete = () => {
    void deleteTask
      .mutateAsync({ taskId: task.id, boardId: task.board_id })
      .then(() => {
        onClose();
      })
      .catch((error: unknown) => {
        logger.error("Failed to delete task", { error, taskId: task.id });
      });
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isJobTracker
            ? "Edit Job Application"
            : isRecipe
            ? "Edit Recipe"
            : "Edit Task"
        }
        maxWidth="2xl"
        closeOnBackdropClick={true}
      >
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Duplicate Error */}
          {duplicateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">
                {duplicateError}
              </p>
            </div>
          )}
          {/* Title - Hidden for job tracker */}
          {!isJobTracker && (
            <Input
              id="task-title"
              label="Task Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          )}

          {/* Description - Hidden for job tracker */}
          {!isJobTracker && (
            <Textarea
              id="task-description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={4}
              maxLength={1000}
            />
          )}

          {/* Job Tracker Specific Fields */}
          {isJobTracker && (
            <JobTaskSection
              task={task}
              onBuildItemData={handleJobItemDataBuilder}
            />
          )}

          {/* Recipe Specific Fields */}
          {isRecipe && (
            <RecipeTaskSection
              task={task}
              onBuildItemData={handleRecipeItemDataBuilder}
              timerDuration={timerDuration}
              setTimerDuration={setTimerDuration}
              timerUnit={timerUnit}
              setTimerUnit={setTimerUnit}
            />
          )}

          {/* Optional Settings Disclosure - Hidden for job tracker and recipes */}
          {!isJobTracker && !isRecipe && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowOptionalSettings(!showOptionalSettings)}
                className="flex items-center justify-end gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ml-auto"
              >
                <span>Optional settings</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showOptionalSettings ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {showOptionalSettings && (
                <div className="mt-6 space-y-6">
                  {/* Icon Appearance */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: themeColor }}>
                      Icon Appearance
                    </label>
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-8">
                        <IconSelect
                          id="task-icon-edit"
                          selectedIcon={icon}
                          onIconChange={(value) => {
                            setIcon(value);
                            setShowColorPicker(false);
                          }}
                          icons={TASK_ICONS}
                          iconColor={iconColor}
                        />
                      </div>
                      <div className="col-span-4 relative" ref={colorPickerRef}>
                        <button
                          type="button"
                          onClick={() => setShowColorPicker(!showColorPicker)}
                          className="w-full flex items-center justify-center gap-2 px-4 h-[42px] rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white"
                        >
                          <span className="text-sm font-medium">Icon Color</span>
                          <div
                            className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: iconColor }}
                          />
                        </button>
                        {showColorPicker && (
                          <div className="absolute top-full mt-2 right-0 z-50 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 space-y-3 w-[280px]">
                            <Input
                              id="task-icon-hex-edit"
                              label="Color"
                              type="text"
                              value={iconColor}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                  setIconColor(value);
                                }
                              }}
                              placeholder="#9333ea"
                              maxLength={7}
                            />
                            <CompactColorThemePicker
                              selectedColor={iconColor}
                              onColorChange={setIconColor}
                              title=""
                              showPreview={false}
                              pickerHeightPx={140}
                              showHexInput={false}
                            />
                            <button
                              type="button"
                              onClick={() => setShowColorPicker(false)}
                              className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TaskSchedulingControls now includes Date, Repeatable, Timer */}
                  <TaskSchedulingControls
                    themeColor={themeColor}
                    dueDate={dueDate}
                    setDueDate={setDueDate}
                    isRepeatable={isRepeatable}
                    setIsRepeatable={setIsRepeatable}
                    repeatFrequency={repeatFrequency}
                    setRepeatFrequency={setRepeatFrequency}
                    repeatInterval={repeatInterval}
                    setRepeatInterval={setRepeatInterval}
                    hasTimer={hasTimer}
                    setHasTimer={setHasTimer}
                    timerDuration={timerDuration}
                    setTimerDuration={setTimerDuration}
                    timerUnit={timerUnit}
                    setTimerUnit={setTimerUnit}
                    repeatFrequencySelectId="repeat-frequency-edit"
                    timerDurationSelectId="timer-duration-edit"
                    timerUnitSelectId="timer-unit-edit"
                  />
                </div>
              )}
            </div>
          )}

          {/* Spacer for consistent divider spacing - only when optional settings expanded */}
          {showOptionalSettings && <div className="h-2" />}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              icon={<Trash2 className="w-4 h-4" />}
              iconPosition="left"
            >
              Delete
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={
                isJobTracker
                  ? !isJobValid || updateTask.isPending
                  : isRecipe
                  ? !isRecipeValid || updateTask.isPending
                  : !title.trim() || updateTask.isPending
              }
            >
              {updateTask.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        variant="danger"
        isLoading={deleteTask.isPending}
      />
    </>
  );
};

export default TaskDetailModal;
