/**
 * Markdown To-Do Item Modal
 * Simple, lightweight modal for creating/editing markdown to-do list items
 * Separate from the complex task system
 */

import React, { useState, useEffect } from "react";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import { useCreateTask, useUpdateTask } from "../../hooks/useTasksQueries";
import { useTheme } from "../../hooks/useTheme";
import type { Task, CreateTaskData } from "../../services/tasksService.types";

interface MarkdownToDoModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  task?: Task | null; // If editing existing item
}

const MarkdownToDoModal: React.FC<MarkdownToDoModalProps> = ({
  isOpen,
  onClose,
  boardId,
  task,
}) => {
  const { themeColor } = useTheme();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.description || "");
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (task) {
      // Update existing item
      void updateTask
        .mutateAsync({
          taskId: task.id,
          updates: {
            title,
            description: notes || undefined,
          },
        })
        .then(() => {
          onClose();
          resetForm();
        })
        .catch((err) => {
          console.error("Failed to update to-do item:", err);
        });
    } else {
      // Create new item
      const taskData: CreateTaskData = {
        board_id: boardId,
        section_id: undefined,
        title,
        description: notes || undefined,
      };

      void createTask
        .mutateAsync(taskData)
        .then(() => {
          onClose();
          resetForm();
        })
        .catch((err) => {
          console.error("Failed to create to-do item:", err);
        });
    }
  };

  const resetForm = () => {
    setTitle("");
    setNotes("");
  };

  const handleClose = () => {
    onClose();
    if (!task) {
      // Only reset form when creating new item (not editing)
      setTimeout(resetForm, 300);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={task ? "Edit To-Do" : "Add To-Do"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What do you need to do? <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Buy groceries, Call dentist, Finish report..."
            required
            autoFocus
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details or context..."
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Supports markdown formatting
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={
              !title.trim() || createTask.isPending || updateTask.isPending
            }
            style={{ backgroundColor: themeColor }}
          >
            {createTask.isPending || updateTask.isPending
              ? "Saving..."
              : task
              ? "Update"
              : "Add"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MarkdownToDoModal;
