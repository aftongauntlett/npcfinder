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
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import JobTaskSection from "./JobTaskSection";
import RecipeTaskSection from "./RecipeTaskSection";
import TaskTimerSection from "./TaskTimerSection";
import TaskReminderSection from "./TaskReminderSection";
import type { Task } from "../../services/tasksService.types";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
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
    tags,
    setTags,
    buildBaseUpdates,
  } = useTaskFormState(task);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // Detect template type using helper functions
  const isJobTracker = isJobTrackerTask(task);
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

          {/* Timer Section */}
          <TaskTimerSection task={task} />

          {/* Reminder Section */}
          <TaskReminderSection task={task} />

          {/* Tags - Hidden for job tracker */}
          {!isJobTracker && (
            <div>
              <label
                htmlFor="task-tags"
                className="block text-sm font-medium text-primary mb-2.5"
              >
                Tags
              </label>
              <Input
                id="task-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="work, urgent, personal"
                helperText="Separate tags with commas"
              />
            </div>
          )}

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
