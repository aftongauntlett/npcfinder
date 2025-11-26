/**
 * Create Task Modal
 * Modal for creating new tasks
 */

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import type { CreateTaskData } from "../../services/tasksService.types";
import { useCreateTask } from "../../hooks/useTasksQueries";
import { useUrlMetadata } from "../../hooks/useUrlMetadata";
import { PRIORITY_OPTIONS } from "../../utils/taskConstants";
import { Link, Loader2, ChevronDown } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId?: string | null;
  boardType?: string | null;
  defaultSectionId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  boardId,
  boardType,
}) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | null>(
    null
  );
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tags, setTags] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const createTask = useCreateTask();
  const { fetchMetadata, loading: urlLoading } = useUrlMetadata();

  const handleUrlChange = async (value: string) => {
    setUrl(value);

    // Auto-fill when URL looks valid (has http/https)
    if (value.match(/^https?:\/\/.+/)) {
      const metadata = await fetchMetadata(value);
      if (metadata) {
        // Auto-fill from job posting
        if (metadata.jobPosting) {
          const { company, position } = metadata.jobPosting;
          if (position) setTitle(position);
          if (company) {
            setDescription(
              (prev) =>
                `Company: ${company}${
                  metadata.jobPosting?.location
                    ? `\nLocation: ${metadata.jobPosting.location}`
                    : ""
                }${
                  metadata.jobPosting?.salary
                    ? `\nSalary: ${metadata.jobPosting.salary}`
                    : ""
                }${prev ? `\n\n${prev}` : ""}`
            );
          }
        }
        // Auto-fill from recipe
        else if (metadata.recipe) {
          if (metadata.recipe.name) setTitle(metadata.recipe.name);
          if (metadata.recipe.description)
            setDescription(metadata.recipe.description);
        }
        // General metadata fallback
        else {
          if (metadata.title && !title) setTitle(metadata.title);
          if (metadata.description && !description)
            setDescription(metadata.description);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: CreateTaskData = {
      board_id: boardId || null,
      title,
      description: description || undefined,
      priority: priority || undefined,
      due_date: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    };

    void createTask
      .mutateAsync(taskData)
      .then(() => {
        // Reset form
        setUrl("");
        setTitle("");
        setDescription("");
        setPriority(null);
        setDueDate(null);
        setTags("");
        setShowOptional(false);
        onClose();
      })
      .catch((error) => {
        console.error("Failed to create task:", error);
      });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      maxWidth="2xl"
      closeOnBackdropClick={true}
    >
      {/* Form */}
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="p-6 space-y-5"
      >
        {/* Quick Add from URL - Only for job tracker and recipe boards */}
        {(boardType === "job_tracker" || boardType === "recipe") && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <label
              htmlFor="task-url"
              className="flex items-center gap-2 text-sm font-medium text-purple-900 dark:text-purple-200 mb-2"
            >
              <Link className="w-4 h-4" />
              Quick Add from URL (Optional)
            </label>
            <div className="relative">
              <input
                id="task-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste a job posting or recipe URL..."
                className="block w-full rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors"
              />
              {urlLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />
              )}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
              Auto-fills title and details as soon as you paste a link
            </p>
          </div>
        )}

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
            placeholder="What needs to be done?"
            required
            maxLength={200}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors"
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
            rows={3}
            maxLength={1000}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors"
          />
        </div>

        {/* Optional Fields Accordion */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <span>Optional Fields</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showOptional ? "rotate-180" : ""
              }`}
            />
          </button>

          {showOptional && (
            <div className="px-4 pb-4 space-y-5 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2.5">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setPriority(
                          priority === option.value ? null : option.value
                        )
                      }
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
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors"
                    calendarClassName="bg-white dark:bg-gray-800 border-2 border-purple-500 dark:border-purple-400 rounded-lg shadow-xl"
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
                  placeholder="work, urgent, personal (comma-separated)"
                  helperText="Separate tags with commas"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
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
            disabled={!title.trim() || createTask.isPending}
          >
            {createTask.isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
