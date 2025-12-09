/**
 * Task Detail Modal
 * Modal for viewing and editing task details
 * Fetches fresh task data to ensure updates are reflected
 */

import React, { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import { logger } from "@/lib/logger";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Select from "../shared/ui/Select";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import { useTheme } from "../../hooks/useTheme";
import JobTaskSection from "./JobTaskSection";
import RecipeTaskSection from "./RecipeTaskSection";
import TaskTimerSection from "./TaskTimerSection";
import type { Task } from "../../services/tasksService.types";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useTasks,
} from "../../hooks/useTasksQueries";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../../utils/taskConstants";
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
    status,
    setStatus,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    buildBaseUpdates,
  } = useTaskFormState(task);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const { themeColor } = useTheme();

  // Repeatable task state
  const [isRepeatable, setIsRepeatable] = useState(task.is_repeatable || false);
  const [repeatFrequency, setRepeatFrequency] = useState<
    "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
  >(
    (task.repeat_frequency as
      | "daily"
      | "weekly"
      | "biweekly"
      | "monthly"
      | "yearly") || "weekly"
  );

  // Timer state
  const [hasTimer, setHasTimer] = useState(!!task.timer_duration_minutes);
  const [timerDuration, setTimerDuration] = useState<number>(
    task.timer_duration_minutes && task.timer_duration_minutes >= 60
      ? Math.floor(task.timer_duration_minutes / 60)
      : task.timer_duration_minutes || 30
  );
  const [timerUnit, setTimerUnit] = useState<"minutes" | "hours">(
    task.timer_duration_minutes && task.timer_duration_minutes >= 60
      ? "hours"
      : "minutes"
  );
  const [isUrgentAfterTimer, setIsUrgentAfterTimer] = useState(
    task.is_urgent_after_timer || false
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

    const updates: Partial<Task> = {
      ...baseUpdates,
      item_data,
      is_repeatable: isRepeatable || undefined,
      repeat_frequency: isRepeatable ? repeatFrequency : null,
      timer_duration_minutes: hasTimer
        ? timerUnit === "hours"
          ? timerDuration * 60
          : timerDuration
        : null,
      is_urgent_after_timer: hasTimer ? isUrgentAfterTimer : null,
    };

    void updateTask
      .mutateAsync({ taskId: task.id, updates })
      .then(() => {
        onClose();
      })
      .catch((error) => {
        logger.error("Failed to update task", { error, taskId: task.id });
      });
  };

  const handleDelete = () => {
    void deleteTask
      .mutateAsync(task.id)
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
            />
          )}

          {/* Status - Hidden for job tracker */}
          {!isJobTracker && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.filter((s) => s.value !== "archived").map(
                  (option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        status === option.value
                          ? `${option.bg} ${option.color} border-current`
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Priority - Hidden for job tracker */}
          {!isJobTracker && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2.5">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority(null)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    priority === null
                      ? "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  None
                </button>
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      priority === option.value
                        ? `${option.bg} ${option.color} border-current`
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Due Date - Hidden for job tracker */}
          {!isJobTracker && (
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-primary mb-2.5"
              >
                Due Date
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDueDate(null)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm whitespace-nowrap ${
                    dueDate === null
                      ? "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  None
                </button>
                <DatePicker
                  selected={dueDate}
                  onChange={(date) => setDueDate(date)}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select a date"
                  minDate={new Date()}
                  showPopperArrow={false}
                  isClearable
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent transition-colors"
                  calendarClassName="bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 rounded-lg shadow-xl"
                  wrapperClassName="flex-1"
                />
              </div>
            </div>
          )}

          {/* Repeatable Task & Timer Toggles - Hidden for job tracker */}
          {!isJobTracker && (
            <div className="space-y-4">
              {/* Repeatable Task Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex-shrink-0 cursor-pointer"
                    onClick={() => {
                      const newValue = !isRepeatable;
                      setIsRepeatable(newValue);
                      if (newValue && !dueDate) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setDueDate(tomorrow);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isRepeatable}
                      onChange={() => {}}
                      className="sr-only peer"
                      tabIndex={-1}
                    />
                    <div
                      className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer transition-colors"
                      style={
                        isRepeatable ? { backgroundColor: themeColor } : {}
                      }
                    ></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Repeatable Task
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Auto-reschedules after completion
                    </p>
                  </div>
                </div>

                {/* Repeat Frequency - Show only if repeatable */}
                {isRepeatable && (
                  <div className="pt-2">
                    <Select
                      id="repeat-frequency-edit"
                      label="Repeat Frequency"
                      value={repeatFrequency}
                      onChange={(e) =>
                        setRepeatFrequency(
                          e.target.value as
                            | "daily"
                            | "weekly"
                            | "biweekly"
                            | "monthly"
                            | "yearly"
                        )
                      }
                      options={[
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Bi-weekly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "yearly", label: "Annually" },
                      ]}
                      size="sm"
                    />
                    {!dueDate && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        ⚠️ Due date required for repeatable tasks
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Timer Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex-shrink-0 cursor-pointer"
                    onClick={() => setHasTimer(!hasTimer)}
                  >
                    <input
                      type="checkbox"
                      checked={hasTimer}
                      onChange={() => {}}
                      className="sr-only peer"
                      tabIndex={-1}
                    />
                    <div
                      className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer transition-colors"
                      style={hasTimer ? { backgroundColor: themeColor } : {}}
                    ></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Add Timer
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Set a countdown timer for this task
                    </p>
                  </div>
                </div>

                {/* Timer Duration - Show only if timer enabled */}
                {hasTimer && (
                  <div className="pt-2 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duration
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          max={timerUnit === "hours" ? 24 : 1440}
                          value={timerDuration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const max = timerUnit === "hours" ? 24 : 1440;
                            setTimerDuration(Math.min(max, Math.max(1, val)));
                          }}
                          placeholder="30"
                          className="hide-number-spinner flex-1 block rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                        <div className="w-32">
                          <Select
                            id="timer-unit-edit"
                            value={timerUnit}
                            onChange={(e) => {
                              setTimerUnit(
                                e.target.value as "minutes" | "hours"
                              );
                              if (e.target.value === "hours") {
                                setTimerDuration(
                                  Math.min(24, Math.ceil(timerDuration / 60))
                                );
                              } else {
                                setTimerDuration(
                                  Math.min(1440, timerDuration * 60)
                                );
                              }
                            }}
                            options={[
                              { value: "minutes", label: "Minutes" },
                              { value: "hours", label: "Hours" },
                            ]}
                            size="md"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Urgent After Timer */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUrgentAfterTimer}
                        onChange={(e) =>
                          setIsUrgentAfterTimer(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 checked:bg-current focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
                        style={{
                          accentColor: isUrgentAfterTimer
                            ? themeColor
                            : undefined,
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Mark as urgent when timer completes
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timer Section - Only shows if timer is running */}
          <TaskTimerSection task={task} />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
