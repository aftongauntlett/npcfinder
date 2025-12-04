/**
 * Task Detail Modal
 * Modal for viewing and editing task details
 * Fetches fresh task data to ensure updates are reflected
 */

import React, { useState, useEffect } from "react";
import { Trash2, Bell, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Select from "../shared/ui/Select";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import TimerWidget from "./TimerWidget";
import type { Task } from "../../services/tasksService.types";
import type { StatusHistoryEntry } from "../../services/tasksService.types";
import { getTemplate } from "../../utils/boardTemplates";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
} from "../../hooks/useTasksQueries";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../../utils/taskConstants";
import { shouldShowUrgentAlert } from "../../utils/timerHelpers";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>(
    (task.item_data?.status_history as StatusHistoryEntry[]) || []
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

  // Track previous job status to detect changes
  const [prevJobStatus, setPrevJobStatus] = useState(jobStatus);

  // Detect if this is a job tracker task
  const isJobTracker =
    task.item_data?.company_name !== undefined ||
    task.item_data?.position !== undefined;

  // Detect if this is a recipe task
  const isRecipe =
    task.item_data?.recipe_name !== undefined ||
    task.item_data?.name !== undefined ||
    task.item_data?.ingredients !== undefined;

  // Get job tracker template for status options
  const jobTrackerTemplate = getTemplate("job_tracker");
  const jobStatusOptions = jobTrackerTemplate?.statusOptions || [
    "Applied",
    "Phone Screen",
    "Interview - Round 1",
    "Interview - Round 2",
    "Interview - Round 3",
    "Offer Received",
    "Rejected",
    "No Response",
    "Accepted",
    "Declined",
  ];

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
    const currentJobStatus = (task.item_data?.status as string) || "Applied";
    setJobStatus(currentJobStatus);
    setPrevJobStatus(currentJobStatus); // Sync prevJobStatus to prevent duplicate entries

    // Initialize status_history from existing array or create from date_applied for legacy tasks
    const existingHistory = task.item_data
      ?.status_history as StatusHistoryEntry[];
    if (existingHistory && existingHistory.length > 0) {
      setStatusHistory(existingHistory);
    } else if (isJobTracker && task.item_data?.date_applied) {
      // Legacy task with date_applied but no status_history
      setStatusHistory([
        {
          status: currentJobStatus,
          date: task.item_data.date_applied as string,
        },
      ]);
    } else {
      setStatusHistory([]);
    }

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
  }, [task, isJobTracker]);

  // Handle status changes - append to status history
  useEffect(() => {
    if (jobStatus !== prevJobStatus && isJobTracker) {
      const newEntry: StatusHistoryEntry = {
        status: jobStatus,
        date: new Date().toISOString().split("T")[0],
      };
      setStatusHistory((prev) => [...prev, newEntry]);
      setPrevJobStatus(jobStatus);
    }
  }, [jobStatus, prevJobStatus, isJobTracker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine if this is a template-specific task and build item_data accordingly
    let item_data = task.item_data ? { ...task.item_data } : undefined;

    // Check if this is a job tracker task (by presence of job-specific fields in item_data)
    if (task.item_data?.company_name !== undefined || companyName || position) {
      // Find the date of the first "Applied" status in history, or use existing date_applied
      const appliedEntry = statusHistory.find(
        (entry) => entry.status === "Applied"
      );
      const dateApplied =
        appliedEntry?.date ||
        (task.item_data?.date_applied as string) ||
        new Date().toISOString().split("T")[0];

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
        date_applied: dateApplied,
        status_history: statusHistory,
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
          {(task.item_data?.company_name !== undefined ||
            task.item_data?.position !== undefined) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="company-name"
                  label="Company Name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company name"
                />
                <Input
                  id="position"
                  label="Position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>

              {/* Description (formerly Notes) - larger and supports markdown */}
              <Textarea
                id="job-description"
                label="Description"
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                placeholder="**Role Overview**&#10;&#10;Key responsibilities:\n- Lead feature development\n- Collaborate with cross-functional teams\n- Mentor junior engineers"
                rows={6}
                helperText="Supports basic markdown: **bold**, - bullet lists"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="salary-range"
                  label="Salary Range"
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="$100k - $150k"
                />
                <Input
                  id="location"
                  label="Location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                />
                <Select
                  id="employment-type"
                  label="Employment Type"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  placeholder="Select type"
                  options={[
                    { value: "Full-time", label: "Full-time" },
                    { value: "Part-time", label: "Part-time" },
                    { value: "Contract", label: "Contract" },
                    { value: "Internship", label: "Internship" },
                    { value: "Remote", label: "Remote" },
                  ]}
                />
                <Input
                  id="company-url"
                  label="Company URL"
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-id"
                />
              </div>

              {/* Status and Applied Date - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  id="job-status"
                  label="Status"
                  value={jobStatus}
                  onChange={(e) => setJobStatus(e.target.value)}
                  options={jobStatusOptions.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                />

                {/* Date for current status */}
                {statusHistory.length > 0 && (
                  <div>
                    <label
                      htmlFor="status-date"
                      className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5"
                    >
                      Applied Date
                    </label>
                    <DatePicker
                      id="status-date"
                      selected={
                        statusHistory[statusHistory.length - 1]?.date
                          ? new Date(
                              statusHistory[statusHistory.length - 1].date
                            )
                          : new Date()
                      }
                      onChange={(date: Date | null) => {
                        if (date && statusHistory.length > 0) {
                          const updatedHistory = [...statusHistory];
                          updatedHistory[updatedHistory.length - 1] = {
                            ...updatedHistory[updatedHistory.length - 1],
                            date: date.toISOString().split("T")[0],
                          };
                          setStatusHistory(updatedHistory);
                        }
                      }}
                      dateFormat="MM/dd/yyyy"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none transition-colors"
                      wrapperClassName="w-full"
                      calendarClassName="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                )}
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
                <Input
                  id="recipe-name"
                  label="Recipe Name"
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="Chocolate Chip Cookies"
                />
                <Input
                  id="recipe-url"
                  label="Source URL"
                  type="url"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  placeholder="https://recipe-site.com/..."
                />
                <Input
                  id="prep-time"
                  label="Prep Time"
                  type="text"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="15 minutes"
                />
                <Input
                  id="cook-time"
                  label="Cook Time"
                  type="text"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="30 minutes"
                />
                <Input
                  id="total-time"
                  label="Total Time"
                  type="text"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  placeholder="45 minutes"
                />
                <Input
                  id="servings"
                  label="Servings"
                  type="text"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="4"
                />
              </div>
              <Textarea
                id="ingredients"
                label="Ingredients (one per line)"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="2 cups flour&#10;1 cup sugar&#10;2 eggs"
                rows={4}
              />
              <Textarea
                id="instructions"
                label="Instructions (one step per line)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients"
                rows={4}
              />
              <Textarea
                id="recipe-notes"
                label="Notes"
                value={recipeNotes}
                onChange={(e) => setRecipeNotes(e.target.value)}
                placeholder="Personal notes, modifications, etc."
                rows={2}
              />
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

          {/* Timer Section */}
          {task.timer_duration_minutes && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {shouldShowUrgentAlert(task) && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded bg-red-100 dark:bg-red-900/20">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Timer completed - marked as urgent
                  </p>
                </div>
              )}
              <TimerWidget task={task} />
            </div>
          )}

          {/* Reminder Section */}
          {task.reminder_date && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reminder
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(task.reminder_date).toLocaleString()}
                  </p>
                  {task.reminder_sent_at && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Sent: {new Date(task.reminder_sent_at).toLocaleString()}
                    </p>
                  )}
                </div>
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
