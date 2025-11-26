/**
 * Task Detail Modal
 * Modal for viewing and editing task details
 * Fetches fresh task data to ensure updates are reflected
 */

import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import type { Task } from "../../services/tasksService.types";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
} from "../../hooks/useTasksQueries";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../../utils/taskConstants";

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

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState<typeof task.priority>(task.priority);
  const [dueDate, setDueDate] = useState<Date | null>(
    task.due_date ? new Date(task.due_date) : null
  );
  const [tags, setTags] = useState(task.tags?.join(", ") || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Update form when task changes (including when fresh data is fetched)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date ? new Date(task.due_date) : null);
    setTags(task.tags?.join(", ") || "");
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<Task> = {
      title,
      description: description || null,
      status,
      priority: priority || null,
      due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : null,
    };

    void updateTask
      .mutateAsync({ taskId: task.id, updates })
      .then(() => {
        onClose();
      })
      .catch((error) => {
        console.error("Failed to update task:", error);
      });
  };

  const handleDelete = () => {
    void deleteTask
      .mutateAsync(task.id)
      .then(() => {
        onClose();
      })
      .catch((error: unknown) => {
        console.error("Failed to delete task:", error);
      });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      maxWidth="2xl"
      closeOnBackdropClick={true}
    >
      {/* Delete Confirmation Banner */}
      {showDeleteConfirm && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            Are you sure you want to delete this task? This action cannot be
            undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {deleteTask.isPending ? "Deleting..." : "Delete Task"}
            </Button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Title */}
        <div>
          <label
            htmlFor="task-title"
            className="block text-sm font-medium text-primary mb-2.5"
          >
            Task Title *
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="task-description"
            className="block text-sm font-medium text-primary mb-2.5"
          >
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={4}
            maxLength={1000}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Status */}
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

        {/* Priority */}
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

        {/* Due Date */}
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

        {/* Tags */}
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

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
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
            disabled={!title.trim() || updateTask.isPending}
          >
            {updateTask.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskDetailModal;
