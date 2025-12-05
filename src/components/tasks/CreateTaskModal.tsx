/**
 * Create Task Modal
 * Modal for creating new tasks
 */

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import { logger } from "@/lib/logger";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Select from "../shared/ui/Select";
import type { CreateTaskData } from "../../services/tasksService.types";
import { useCreateTask } from "../../hooks/useTasksQueries";
import { useUrlMetadata } from "../../hooks/useUrlMetadata";
import { PRIORITY_OPTIONS } from "../../utils/taskConstants";
import { Link, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { lightenColor, darkenColor } from "../../styles/colorThemes";
import {
  applyJobMetadataToForm,
  applyRecipeMetadataToForm,
  applyGenericMetadataToForm,
} from "../../utils/metadataFormHelpers";

// Helper to get local date in YYYY-MM-DD format (not UTC)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
  defaultSectionId,
}) => {
  const { themeColor } = useTheme();
  const [url, setUrl] = useState("");
  const [urlFeedback, setUrlFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | null>(
    null
  );
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tags, setTags] = useState(""); // Keep for DB, but hidden from UI

  // Repeatable task fields
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<
    "weekly" | "monthly" | "yearly" | "custom"
  >("weekly");
  const [repeatCustomDays, setRepeatCustomDays] = useState<number>(7);

  // Timer fields
  const [hasTimer, setHasTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [isUrgentAfterTimer, setIsUrgentAfterTimer] = useState(false);

  // Reminder fields
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState<string>("09:00");

  // Job tracker specific fields
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [position, setPosition] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobNotes, setJobNotes] = useState("");
  const [status, setStatus] = useState("Applied");

  // Recipe specific fields
  const [recipeName, setRecipeName] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [servings, setServings] = useState("");
  const [recipeNotes, setRecipeNotes] = useState("");

  const createTask = useCreateTask();
  const { fetchMetadata, loading: urlLoading } = useUrlMetadata();

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setUrlFeedback(null);

    // Auto-fill when URL looks valid (has http/https)
    if (value.match(/^https?:\/\/.+/)) {
      const metadata = await fetchMetadata(value);

      if (metadata) {
        // Use the kind discriminant to branch on metadata type
        if (metadata.kind === "job" && metadata.jobPosting) {
          const patch = applyJobMetadataToForm(metadata, value);

          // Apply the patch to form state
          if (patch.title) setTitle(patch.title);
          if (patch.position) setPosition(patch.position);
          if (patch.companyName) setCompanyName(patch.companyName);
          if (patch.companyUrl) setCompanyUrl(patch.companyUrl);
          if (patch.salaryRange) setSalaryRange(patch.salaryRange);
          if (patch.location) setLocation(patch.location);
          if (patch.employmentType) setEmploymentType(patch.employmentType);
          if (patch.description) setDescription(patch.description);

          // Provide feedback to user
          if (patch.extractedFields > 0) {
            setUrlFeedback({
              type: "success",
              message: `Auto-filled ${patch.fieldNames.join(", ")}`,
            });
          } else {
            setUrlFeedback({
              type: "warning",
              message: "Couldn't extract job details - please fill manually",
            });
          }
        } else if (metadata.kind === "recipe" && metadata.recipe) {
          const patch = applyRecipeMetadataToForm(metadata, value);

          // Apply the patch to form state
          if (patch.title) setTitle(patch.title);
          if (patch.recipeName) setRecipeName(patch.recipeName);
          if (patch.description) setDescription(patch.description);
          if (patch.recipeUrl) setRecipeUrl(patch.recipeUrl);
          if (patch.ingredients) setIngredients(patch.ingredients);
          if (patch.instructions) setInstructions(patch.instructions);
          if (patch.prepTime) setPrepTime(patch.prepTime);
          if (patch.cookTime) setCookTime(patch.cookTime);
          if (patch.totalTime) setTotalTime(patch.totalTime);
          if (patch.servings) setServings(patch.servings);

          // Provide feedback to user
          if (patch.extractedFields > 0) {
            setUrlFeedback({
              type: "success",
              message: `Auto-filled ${patch.fieldNames.slice(0, 3).join(", ")}${
                patch.fieldNames.length > 3
                  ? ` +${patch.fieldNames.length - 3} more`
                  : ""
              }`,
            });
          } else {
            setUrlFeedback({
              type: "warning",
              message: "Couldn't extract recipe details - please fill manually",
            });
          }
        } else {
          // Generic metadata fallback
          const patch = applyGenericMetadataToForm(
            metadata,
            title,
            description
          );

          // Apply the patch to form state
          if (patch.title) setTitle(patch.title);
          if (patch.description) setDescription(patch.description);

          // Provide feedback to user
          if (patch.extractedFields > 0) {
            setUrlFeedback({
              type: "success",
              message: `Auto-filled ${patch.fieldNames.join(", ")}`,
            });
          } else {
            setUrlFeedback({
              type: "warning",
              message: "No metadata found - you'll need to fill in manually",
            });
          }
        }
      } else {
        setUrlFeedback({
          type: "error",
          message: "Failed to extract data from URL",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate title for job tracker from company + position if not set
    let finalTitle = title;
    if (boardType === "job_tracker" && !title) {
      finalTitle = `${position || "Position"} at ${companyName || "Company"}`;
    }

    // Build item_data for template-specific boards
    let item_data: Record<string, unknown> | undefined;

    if (boardType === "job_tracker") {
      item_data = {
        company_name: companyName || finalTitle,
        company_url: companyUrl || url || "",
        position: position || finalTitle,
        salary_range: salaryRange || "",
        location: location || "",
        employment_type: employmentType || "",
        date_applied: getLocalDateString(),
        job_description: jobDescription || "",
        notes: jobNotes || "",
        status: status,
        status_history: [
          {
            status: status,
            date: getLocalDateString(),
          },
        ],
      };
    } else if (boardType === "recipe") {
      item_data = {
        recipe_name: recipeName || title,
        name: recipeName || title,
        description: description || "",
        ingredients: ingredients ? ingredients.split("\n").filter(Boolean) : [],
        instructions: instructions
          ? instructions.split("\n").filter(Boolean)
          : [],
        prep_time: prepTime || "",
        cook_time: cookTime || "",
        total_time: totalTime || "",
        servings: servings || "",
        recipe_url: recipeUrl || url || "",
        source_url: recipeUrl || url || "",
        notes: recipeNotes || "",
      };
    }

    const taskData: CreateTaskData = {
      board_id: boardId || null,
      section_id: defaultSectionId || undefined,
      title: finalTitle,
      description: description || undefined,
      priority: priority || undefined,
      due_date: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      item_data,
      is_repeatable: isRepeatable || undefined,
      repeat_frequency: isRepeatable ? repeatFrequency : undefined,
      repeat_custom_days:
        isRepeatable && repeatFrequency === "custom"
          ? repeatCustomDays
          : undefined,
      // Timer fields
      timer_duration_minutes: hasTimer ? timerDuration : undefined,
      is_urgent_after_timer: hasTimer ? isUrgentAfterTimer : undefined,
      // Reminder fields
      reminder_date:
        hasReminder && reminderDate && reminderTime
          ? `${reminderDate.toISOString().split("T")[0]}T${reminderTime}:00`
          : undefined,
    };

    void createTask
      .mutateAsync(taskData)
      .then(() => {
        onClose();
        // Reset form after closing to ensure parent refetches
        setTimeout(() => {
          setUrl("");
          setTitle("");
          setDescription("");
          setPriority(null);
          setDueDate(null);
          setTags(""); // Keep resetting for DB consistency
          // Reset repeatable fields
          setIsRepeatable(false);
          setRepeatFrequency("weekly");
          setRepeatCustomDays(7);
          // Reset timer fields
          setHasTimer(false);
          setTimerDuration(30);
          setIsUrgentAfterTimer(false);
          // Reset reminder fields
          setHasReminder(false);
          setReminderDate(null);
          setReminderTime("09:00");
          // Reset job tracker fields
          setCompanyName("");
          setCompanyUrl("");
          setPosition("");
          setSalaryRange("");
          setLocation("");
          setEmploymentType("");
          setJobDescription("");
          setJobNotes("");
          // Reset recipe fields
          setRecipeName("");
          setRecipeUrl("");
          setIngredients("");
          setInstructions("");
          setPrepTime("");
          setCookTime("");
          setTotalTime("");
          setServings("");
          setRecipeNotes("");
        }, 100);
      })
      .catch((error) => {
        logger.error("Failed to create task", { error });
      });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        boardType === "job_tracker"
          ? "Add Job Application"
          : boardType === "recipe"
          ? "Add Recipe"
          : "Create New Task"
      }
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
        {/* Quick Add from URL - Only for recipe boards (job tracker has it integrated below) */}
        {boardType === "recipe" && (
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: lightenColor(themeColor, 0.9),
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: lightenColor(themeColor, 0.6),
            }}
          >
            <label
              htmlFor="task-url"
              className="flex items-center gap-2 text-sm font-medium mb-2"
              style={{ color: darkenColor(themeColor, 0.4) }}
            >
              <Link className="w-4 h-4" />
              Quick Add from URL (Optional)
            </label>
            <Input
              id="task-url"
              type="url"
              value={url}
              onChange={(e) => void handleUrlChange(e.target.value)}
              placeholder="Paste a recipe URL..."
              leftIcon={<Link className="w-4 h-4" />}
              rightIcon={
                urlLoading ? (
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: themeColor }}
                  />
                ) : undefined
              }
            />
            {/* URL Feedback Message */}
            {urlFeedback && (
              <div
                className={`flex items-start gap-2 mt-2 text-xs px-2 py-1.5 rounded ${
                  urlFeedback.type === "success"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : urlFeedback.type === "warning"
                    ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                }`}
              >
                {urlFeedback.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                )}
                <span>{urlFeedback.message}</span>
              </div>
            )}
            <p
              className="text-xs mt-2"
              style={{ color: darkenColor(themeColor, 0.3) }}
            >
              Auto-fills title and details as soon as you paste a link
            </p>
          </div>
        )}

        {/* Title - Hidden for job tracker and recipe since they have their own fields */}
        {boardType !== "job_tracker" && boardType !== "recipe" && (
          <Input
            id="task-title"
            label="Task Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            maxLength={200}
          />
        )}

        {/* Description - Hidden for job tracker (uses Notes field instead) */}
        {boardType !== "job_tracker" && (
          <Textarea
            id="task-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            maxLength={1000}
            required
          />
        )}

        {/* Job Tracker Specific Fields */}
        {boardType === "job_tracker" && (
          <div className="space-y-4">
            {/* Quick Add URL */}
            <div
              className="border rounded-lg p-3"
              style={{
                backgroundColor: `${themeColor}10`,
                borderColor: `${themeColor}40`,
              }}
            >
              <label
                htmlFor="job-url"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                <Link className="w-4 h-4" />
                Job Posting URL (Optional)
              </label>
              <Input
                id="job-url"
                type="url"
                value={url}
                onChange={(e) => void handleUrlChange(e.target.value)}
                placeholder="Paste job posting URL to auto-fill details..."
                leftIcon={<Link className="w-4 h-4" />}
                rightIcon={
                  urlLoading ? (
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: themeColor }}
                    />
                  ) : undefined
                }
              />
              {/* URL Feedback Message */}
              {urlFeedback && (
                <div
                  className={`flex items-start gap-2 mt-2 text-xs px-2 py-1.5 rounded ${
                    urlFeedback.type === "success"
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : urlFeedback.type === "warning"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {urlFeedback.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{urlFeedback.message}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Or fill in the details manually below
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="company-name"
                label="Company Name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                required
              />
              <Input
                id="position"
                label="Position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Software Engineer"
                required
              />
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
              <Select
                id="status"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "Applied", label: "Applied" },
                  { value: "Phone Screen", label: "Phone Screen" },
                  {
                    value: "Interview - Round 1",
                    label: "Interview - Round 1",
                  },
                  {
                    value: "Interview - Round 2",
                    label: "Interview - Round 2",
                  },
                  {
                    value: "Interview - Round 3",
                    label: "Interview - Round 3",
                  },
                  { value: "Offer Received", label: "Offer Received" },
                  { value: "Accepted", label: "Accepted" },
                  { value: "Rejected", label: "Rejected" },
                  { value: "Declined", label: "Declined" },
                  { value: "No Response", label: "No Response" },
                ]}
              />
            </div>
            <Textarea
              id="job-description"
              label="Job Description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste or type the full job description here..."
              rows={8}
              resize="vertical"
            />
            <Textarea
              id="job-notes"
              label="Notes"
              value={jobNotes}
              onChange={(e) => setJobNotes(e.target.value)}
              placeholder="Interview notes, contacts, follow-ups, etc."
              rows={8}
              resize="vertical"
            />
          </div>
        )}

        {/* Recipe Specific Fields */}
        {boardType === "recipe" && (
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
                inputMode="numeric"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15 minutes"
              />
              <Input
                id="cook-time"
                label="Cook Time"
                type="text"
                inputMode="numeric"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="30 minutes"
              />
              <Input
                id="total-time"
                label="Total Time"
                type="text"
                inputMode="numeric"
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

        {/* Optional Fields - Hidden for job tracker */}
        {/* TODO: Tags field removed from UI but kept in DB - may add back later with better UX */}
        {boardType !== "job_tracker" && (
          <div className="space-y-5">
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
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2.5 pr-10 focus:outline-none  focus:border-transparent transition-colors"
                  calendarClassName="bg-white dark:bg-gray-800 border-2 rounded-lg shadow-xl"
                  wrapperClassName="flex-1"
                />
              </div>
            </div>

            {/* Repeatable Task Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isRepeatable}
                    onChange={(e) => {
                      setIsRepeatable(e.target.checked);
                      // If enabling repeatable and no due date, prompt user
                      if (e.target.checked && !dueDate) {
                        // Set default to tomorrow
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setDueDate(tomorrow);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer transition-colors"
                    style={isRepeatable ? { backgroundColor: themeColor } : {}}
                  ></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Repeatable Task
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Auto-reschedules after completion
                  </p>
                </div>
              </label>
            </div>

            {/* Repeat Frequency - Show only if repeatable */}
            {isRepeatable && (
              <div className="pl-14 space-y-3">
                <label className="block text-sm font-medium text-primary mb-2.5">
                  Repeat Frequency
                  {!dueDate && (
                    <span className="ml-2 text-xs text-red-500">
                      (Due date required)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                    { value: "custom", label: "Custom" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setRepeatFrequency(
                          option.value as
                            | "weekly"
                            | "monthly"
                            | "yearly"
                            | "custom"
                        )
                      }
                      className="px-3 py-2 rounded-lg border-2 transition-all text-sm"
                      style={
                        repeatFrequency === option.value
                          ? {
                              borderColor: themeColor,
                              backgroundColor: lightenColor(themeColor, 0.9),
                              color: darkenColor(themeColor, 0.3),
                            }
                          : {
                              borderColor: "",
                            }
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Custom Days Input */}
                {repeatFrequency === "custom" && (
                  <div>
                    <label
                      htmlFor="custom-days"
                      className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      Repeat every (days)
                    </label>
                    <Input
                      id="custom-days"
                      type="number"
                      min={1}
                      max={365}
                      value={repeatCustomDays}
                      onChange={(e) =>
                        setRepeatCustomDays(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {/* Timer Section */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={hasTimer}
                    onChange={(e) => setHasTimer(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer transition-colors"
                    style={hasTimer ? { backgroundColor: themeColor } : {}}
                  ></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Add Timer
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Set a countdown timer for this task
                  </p>
                </div>
              </label>
            </div>

            {/* Timer Duration - Show only if timer enabled */}
            {hasTimer && (
              <div className="pl-14 space-y-3">
                <div>
                  <label
                    htmlFor="timer-duration"
                    className="block text-sm font-medium text-primary mb-2"
                  >
                    Duration (minutes)
                  </label>
                  <Input
                    id="timer-duration"
                    type="number"
                    min={1}
                    max={1440}
                    value={timerDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setTimerDuration(Math.min(1440, Math.max(1, val)));
                    }}
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Max 1440 minutes (24 hours)
                  </p>
                </div>

                {/* Urgent After Timer */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgentAfterTimer}
                    onChange={(e) => setIsUrgentAfterTimer(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                    style={
                      isUrgentAfterTimer ? { accentColor: themeColor } : {}
                    }
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mark as urgent when timer completes
                  </span>
                </label>
              </div>
            )}

            {/* Reminder Section */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={hasReminder}
                    onChange={(e) => setHasReminder(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer transition-colors"
                    style={hasReminder ? { backgroundColor: themeColor } : {}}
                  ></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Set Reminder
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get notified at a specific date/time
                  </p>
                </div>
              </label>
            </div>

            {/* Reminder Date/Time - Show only if reminder enabled */}
            {hasReminder && (
              <div className="pl-14 space-y-3">
                <div>
                  <label
                    htmlFor="reminder-date"
                    className="block text-sm font-medium text-primary mb-2"
                  >
                    Reminder Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      id="reminder-date"
                      selected={reminderDate}
                      onChange={(date) => setReminderDate(date)}
                      dateFormat="MMM d, yyyy"
                      placeholderText="Select date"
                      minDate={new Date()}
                      showPopperArrow={false}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none transition-colors"
                      calendarClassName="bg-white dark:bg-gray-800 border-2 rounded-lg shadow-xl"
                    />
                    <Input
                      id="reminder-time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
            disabled={
              createTask.isPending ||
              (boardType === "job_tracker"
                ? !companyName.trim() || !position.trim()
                : !title.trim() || !description.trim()) ||
              (isRepeatable && !dueDate)
            }
          >
            {createTask.isPending
              ? "Creating..."
              : boardType === "job_tracker"
              ? "Add Job Application"
              : boardType === "recipe"
              ? "Add Recipe"
              : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
