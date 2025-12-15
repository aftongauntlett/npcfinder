/**
 * Kanban Task Modal
 * 
 * Simple modal for creating/editing tasks within kanban boards
 * Only includes title and description - no due dates, repeats, timers, etc.
 */

import React, { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import { Trash2 } from "lucide-react";
import type { Task, CreateTaskData } from "../../services/tasksService.types";
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTasks,
} from "../../hooks/useTasksQueries";

interface KanbanTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  sectionId?: string;
  task?: Task | null; // If provided, edit mode; otherwise create mode
}

const KanbanTaskModal: React.FC<KanbanTaskModalProps> = ({
  isOpen,
  onClose,
  boardId,
  sectionId,
  task,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: existingTasks = [] } = useTasks(boardId);

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDuplicateError(null);
    } else {
      setTitle("");
      setDescription("");
      setDuplicateError(null);
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicates (same title in same board)
    const trimmedTitle = title.trim().toLowerCase();
    const isDuplicate = existingTasks.some(
      (t) =>
        t.title.toLowerCase() === trimmedTitle &&
        (!task || t.id !== task.id) // Exclude current task when editing
    );

    if (isDuplicate) {
      setDuplicateError(
        "A task with this title already exists in this board"
      );
      return;
    }

    if (task) {
      // Update existing task
      void updateTask
        .mutateAsync({
          taskId: task.id,
          updates: {
            title,
            description: description || null,
          },
          boardId,
        })
        .then(() => {
          onClose();
        })
        .catch((error) => {
          logger.error("Failed to update kanban task", {
            error,
            taskId: task.id,
          });
        });
    } else {
      // Create new task
      const taskData: CreateTaskData = {
        board_id: boardId,
        section_id: sectionId,
        title,
        description: description || undefined,
        status: "todo",
      };

      void createTask
        .mutateAsync(taskData)
        .then(() => {
          onClose();
          // Reset form
          setTimeout(() => {
            setTitle("");
            setDescription("");
            setDuplicateError(null);
          }, 100);
        })
        .catch((error) => {
          logger.error("Failed to create kanban task", { error, boardId });
        });
    }
  };

  const handleDelete = () => {
    if (!task) return;

    void deleteTask
      .mutateAsync({ taskId: task.id, boardId })
      .then(() => {
        onClose();
      })
      .catch((error) => {
        logger.error("Failed to delete kanban task", {
          error,
          taskId: task.id,
        });
      });
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={task ? "Edit Task" : "Create Task"}
        maxWidth="lg"
        closeOnBackdropClick={true}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <Input
            id="task-title"
            label="Title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDuplicateError(null);
            }}
            placeholder="What needs to be done?"
            required
            autoFocus
            maxLength={200}
            error={duplicateError || undefined}
          />

          {/* Description */}
          <Textarea
            id="task-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any details or notes..."
            rows={4}
            maxLength={1000}
            resize="vertical"
          />

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4">
            {/* Delete Button (Edit Mode Only) */}
            {task && !showDeleteModal && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(true)}
                icon={<Trash2 className="w-4 h-4" />}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </Button>
            )}

            {/* Spacer when no delete button */}
            {!task && <div />}

            {/* Cancel and Submit */}
            <div className="flex gap-3 ml-auto">
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
                  !title.trim() ||
                  createTask.isPending ||
                  updateTask.isPending
                }
              >
                {task
                  ? updateTask.isPending
                    ? "Saving..."
                    : "Save"
                  : createTask.isPending
                  ? "Creating..."
                  : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {task && (
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
      )}
    </>
  );
};

export default KanbanTaskModal;
