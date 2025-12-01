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
import CustomDropdown from "../ui/CustomDropdown";
import type { Task } from "../../services/tasksService.types";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
} from "../../hooks/useTasksQueries";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../../utils/taskConstants";
import { useTheme } from "../../hooks/useTheme";

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

  // Job tracker specific fields
  const [companyName, setCompanyName] = useState(
    (task.item_data?.company_name as string) || ""
  );
  const [companyUrl, setCompanyUrl] = useState(
    (task.item_data?.company_url as string) || ""
  );
  const [position, setPosition] = useState(
    (task.item_data?.position as string) || ""
  );
  const [salaryRange, setSalaryRange] = useState(
    (task.item_data?.salary_range as string) || ""
  );
  const [location, setLocation] = useState(
    (task.item_data?.location as string) || ""
  );
  const [employmentType, setEmploymentType] = useState(
    (task.item_data?.employment_type as string) || ""
  );
  const [jobNotes, setJobNotes] = useState(
    (task.item_data?.notes as string) || ""
  );
  const [jobStatus, setJobStatus] = useState(
    (task.item_data?.status as string) || "Applied"
  );

  // Recipe specific fields
  const [recipeName, setRecipeName] = useState(
    (task.item_data?.recipe_name as string) ||
      (task.item_data?.name as string) ||
      ""
  );
  const [recipeUrl, setRecipeUrl] = useState(
    (task.item_data?.recipe_url as string) ||
      (task.item_data?.source_url as string) ||
      ""
  );
  const [ingredients, setIngredients] = useState(() => {
    const ing = task.item_data?.ingredients;
    return Array.isArray(ing) ? ing.join("\n") : (ing as string) || "";
  });
  const [instructions, setInstructions] = useState(() => {
    const inst = task.item_data?.instructions;
    return Array.isArray(inst) ? inst.join("\n") : (inst as string) || "";
  });
  const [prepTime, setPrepTime] = useState(
    (task.item_data?.prep_time as string) || ""
  );
  const [cookTime, setCookTime] = useState(
    (task.item_data?.cook_time as string) || ""
  );
  const [totalTime, setTotalTime] = useState(
    (task.item_data?.total_time as string) || ""
  );
  const [servings, setServings] = useState(
    (task.item_data?.servings as string) || ""
  );
  const [recipeNotes, setRecipeNotes] = useState(
    (task.item_data?.notes as string) || ""
  );

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { themeColor } = useTheme();

  // Detect if this is a job tracker task
  const isJobTracker =
    task.item_data?.company_name !== undefined ||
    task.item_data?.position !== undefined;

  // Update form when task changes (including when fresh data is fetched)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date ? new Date(task.due_date) : null);
    setTags(task.tags?.join(", ") || "");

    // Update job tracker fields
    setCompanyName((task.item_data?.company_name as string) || "");
    setCompanyUrl((task.item_data?.company_url as string) || "");
    setPosition((task.item_data?.position as string) || "");
    setSalaryRange((task.item_data?.salary_range as string) || "");
    setLocation((task.item_data?.location as string) || "");
    setEmploymentType((task.item_data?.employment_type as string) || "");
    setJobNotes((task.item_data?.notes as string) || "");
    setJobStatus((task.item_data?.status as string) || "Applied");

    // Update recipe fields
    setRecipeName(
      (task.item_data?.recipe_name as string) ||
        (task.item_data?.name as string) ||
        ""
    );
    setRecipeUrl(
      (task.item_data?.recipe_url as string) ||
        (task.item_data?.source_url as string) ||
        ""
    );
    const ing = task.item_data?.ingredients;
    setIngredients(Array.isArray(ing) ? ing.join("\n") : (ing as string) || "");
    const inst = task.item_data?.instructions;
    setInstructions(
      Array.isArray(inst) ? inst.join("\n") : (inst as string) || ""
    );
    setPrepTime((task.item_data?.prep_time as string) || "");
    setCookTime((task.item_data?.cook_time as string) || "");
    setTotalTime((task.item_data?.total_time as string) || "");
    setServings((task.item_data?.servings as string) || "");
    setRecipeNotes((task.item_data?.notes as string) || "");
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine if this is a template-specific task and build item_data accordingly
    let item_data = task.item_data ? { ...task.item_data } : undefined;

    // Check if this is a job tracker task (by presence of job-specific fields in item_data)
    if (task.item_data?.company_name !== undefined || companyName || position) {
      item_data = {
        ...item_data,
        company_name: companyName,
        company_url: companyUrl,
        position: position,
        salary_range: salaryRange,
        location: location,
        employment_type: employmentType,
        notes: jobNotes,
        status: jobStatus,
        date_applied:
          (task.item_data?.date_applied as string) ||
          new Date().toISOString().split("T")[0],
      };
    }
    // Check if this is a recipe task
    else if (
      task.item_data?.recipe_name !== undefined ||
      task.item_data?.name !== undefined ||
      recipeName
    ) {
      item_data = {
        ...item_data,
        recipe_name: recipeName,
        name: recipeName,
        description: description,
        ingredients: ingredients ? ingredients.split("\n").filter(Boolean) : [],
        instructions: instructions
          ? instructions.split("\n").filter(Boolean)
          : [],
        prep_time: prepTime,
        cook_time: cookTime,
        total_time: totalTime,
        servings: servings,
        recipe_url: recipeUrl,
        source_url: recipeUrl,
        notes: recipeNotes,
      };
    }

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
      item_data,
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
      title={isJobTracker ? "Edit Job Application" : "Edit Task"}
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
        {/* Title - Hidden for job tracker */}
        {!isJobTracker && (
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
        )}

        {/* Description - Hidden for job tracker */}
        {!isJobTracker && (
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
        )}

        {/* Job Tracker Specific Fields */}
        {(task.item_data?.company_name !== undefined ||
          task.item_data?.position !== undefined) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="company-name"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = `0 0 0 3px ${themeColor}33`)
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "")}
                  placeholder="Company name"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:border-transparent transition-colors"
                  style={{ outline: "none" }}
                />
              </div>
              <div>
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Position
                </label>
                <input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = `0 0 0 3px ${themeColor}33`)
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "")}
                  placeholder="Software Engineer"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:border-transparent transition-colors"
                  style={{ outline: "none" }}
                />
              </div>
              <div>
                <label
                  htmlFor="salary-range"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Salary Range
                </label>
                <input
                  id="salary-range"
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = `0 0 0 3px ${themeColor}33`)
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "")}
                  placeholder="$100k - $150k"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:border-transparent transition-colors"
                  style={{ outline: "none" }}
                />
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = `0 0 0 3px ${themeColor}33`)
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "")}
                  placeholder="San Francisco, CA"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:border-transparent transition-colors"
                  style={{ outline: "none" }}
                />
              </div>
              <CustomDropdown
                id="employment-type"
                label="Employment Type"
                value={employmentType}
                onChange={setEmploymentType}
                options={[
                  "Full-time",
                  "Part-time",
                  "Contract",
                  "Internship",
                  "Remote",
                ]}
                placeholder="Select type"
                themeColor={themeColor}
              />
              <div>
                <label
                  htmlFor="company-url"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Company URL
                </label>
                <input
                  id="company-url"
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = `0 0 0 3px ${themeColor}33`)
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "")}
                  placeholder="https://company.com/careers/job-id"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:border-transparent transition-colors"
                  style={{ outline: "none" }}
                />
              </div>
            </div>

            {/* Status field for job tracker */}
            <CustomDropdown
              id="job-status"
              label="Status"
              value={jobStatus}
              onChange={setJobStatus}
              options={[
                "Applied",
                "Phone Screen",
                "Interview",
                "Offer",
                "Accepted",
                "Rejected",
              ]}
              themeColor={themeColor}
            />

            <div>
              <label
                htmlFor="job-notes"
                className="block text-sm font-medium text-primary mb-2"
              >
                Notes
              </label>
              <textarea
                id="job-notes"
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                onFocus={(e) =>
                  (e.target.style.boxShadow = `0 0 0 3px ${themeColor}33`)
                }
                onBlur={(e) => (e.target.style.boxShadow = "")}
                placeholder="Interview notes, contacts, etc."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:border-transparent transition-colors"
                style={{ outline: "none" }}
              />
            </div>
          </>
        )}

        {/* Recipe Specific Fields */}
        {(task.item_data?.recipe_name !== undefined ||
          task.item_data?.name !== undefined ||
          task.item_data?.ingredients !== undefined) && (
          <div className="space-y-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Recipe Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="recipe-name"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Recipe Name
                </label>
                <input
                  id="recipe-name"
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="Chocolate Chip Cookies"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="recipe-url"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Source URL
                </label>
                <input
                  id="recipe-url"
                  type="url"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  placeholder="https://recipe-site.com/..."
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="prep-time"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Prep Time
                </label>
                <input
                  id="prep-time"
                  type="text"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="15 minutes"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="cook-time"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Cook Time
                </label>
                <input
                  id="cook-time"
                  type="text"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="30 minutes"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="total-time"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Total Time
                </label>
                <input
                  id="total-time"
                  type="text"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  placeholder="45 minutes"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="servings"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Servings
                </label>
                <input
                  id="servings"
                  type="text"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="4"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="ingredients"
                className="block text-sm font-medium text-primary mb-2"
              >
                Ingredients (one per line)
              </label>
              <textarea
                id="ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="2 cups flour&#10;1 cup sugar&#10;2 eggs"
                rows={4}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-primary mb-2"
              >
                Instructions (one step per line)
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients"
                rows={4}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="recipe-notes"
                className="block text-sm font-medium text-primary mb-2"
              >
                Notes
              </label>
              <textarea
                id="recipe-notes"
                value={recipeNotes}
                onChange={(e) => setRecipeNotes(e.target.value)}
                placeholder="Personal notes, modifications, etc."
                rows={2}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
            </div>
          </div>
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
            disabled={
              isJobTracker
                ? !companyName.trim() ||
                  !position.trim() ||
                  updateTask.isPending
                : !title.trim() || updateTask.isPending
            }
          >
            {updateTask.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskDetailModal;
