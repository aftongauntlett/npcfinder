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
import IconPicker from "../shared/common/IconPicker";
import CompactColorThemePicker from "../settings/CompactColorThemePicker";
import { TASK_ICONS } from "@/utils/taskIcons";
import { useTheme } from "../../hooks/useTheme";
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
  const { themeColor } = useTheme();
  const [icon, setIcon] = useState<string | null>(null);
  const [iconColor, setIconColor] = useState<string>(themeColor);
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
      setIcon(task.icon ?? null);
      setIconColor(task.icon_color ?? themeColor);
      setDuplicateError(null);
    } else {
      setTitle("");
      setDescription("");
      setIcon(null);
      setIconColor(themeColor);
      setDuplicateError(null);
    }
  }, [task, isOpen, themeColor]);

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
            icon: icon || null,
            icon_color: iconColor || null,
          },
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
        icon: icon || undefined,
        icon_color: iconColor || undefined,
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
            setIcon(null);
            setIconColor(themeColor);
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
      .mutateAsync(task.id)
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-primary">
                    Task Icon
                  </label>
                  <IconPicker
                    selectedIcon={icon}
                    onIconChange={setIcon}
                    icons={TASK_ICONS}
                  />
                </div>
                <Input
                  id="kanban-task-icon-hex"
                  label="Hex Code"
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
              </div>
            </div>
            <div>
              <CompactColorThemePicker
                selectedColor={iconColor}
                onColorChange={setIconColor}
                title=""
                showPreview={false}
                pickerHeightPx={140}
                showHexInput={false}
              />
            </div>
          </div>

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
