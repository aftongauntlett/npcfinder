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
import { useCreateTask, useTasks } from "../../hooks/useTasksQueries";
import { useUrlMetadata } from "../../hooks/useUrlMetadata";
import { PRIORITY_OPTIONS } from "../../utils/taskConstants";
import { Link, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { TASK_ICONS } from "@/utils/taskIcons";
import TaskSchedulingControls from "./partials/TaskSchedulingControls";
import TaskAppearanceControls from "./partials/TaskAppearanceControls";
import {
  applyJobMetadataToForm,
  applyRecipeMetadataToForm,
  applyGenericMetadataToForm,
} from "../../utils/metadataFormHelpers";
import { detectLocationTypeFromLocationText } from "../../utils/locationTypeDetection";

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
  defaultDueDate?: Date | null;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  boardId,
  boardType,
  defaultSectionId,
  defaultDueDate,
}) => {
  const { themeColor } = useTheme();
  const [url, setUrl] = useState("");
  const [urlFeedback, setUrlFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | null>(
    null
  );
  const [dueDate, setDueDate] = useState<Date | null>(defaultDueDate || null);

  // Repeatable task fields
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<
    "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
  >("weekly");

  // Timer fields
  const [hasTimer, setHasTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [timerUnit, setTimerUnit] = useState<"minutes" | "hours">("minutes");
  const [isUrgentAfterTimer, setIsUrgentAfterTimer] = useState(false);

  // Task icon + color
  const [icon, setIcon] = useState<string | null>(null);
  const [iconColor, setIconColor] = useState<string>(themeColor);

  // Optional sections (progressive disclosure)

  // Job tracker specific fields
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [position, setPosition] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState<"Remote" | "Hybrid" | "In-Office">("In-Office");
  const [employmentType, setEmploymentType] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobNotes, setJobNotes] = useState("");

  // Recipe specific fields
  const [recipeName, setRecipeName] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [servings, setServings] = useState("");
  const [recipeNotes, setRecipeNotes] = useState("");

  const createTask = useCreateTask();
  const { fetchMetadata, loading: urlLoading } = useUrlMetadata();
  const { data: existingTasks = [] } = useTasks(boardId || undefined);

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
          if (patch.locationType) setLocationType(patch.locationType);
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
    setDuplicateError(null);

    // Auto-generate title for job tracker from company + position if not set
    let finalTitle = title;
    if (boardType === "job_tracker" && !title) {
      finalTitle = `${position || "Position"} at ${companyName || "Company"}`;
    }

    // Check for job duplicates
    if (boardType === "job_tracker") {
      const normalizeString = (str: string) => str.toLowerCase().trim();
      const currentCompany = normalizeString(companyName);
      const currentPosition = normalizeString(position);
      const currentUrl = (companyUrl || url || "").trim();

      for (const task of existingTasks) {
        const taskCompany = normalizeString(
          (task.item_data?.company_name as string) || ""
        );
        const taskPosition = normalizeString(
          (task.item_data?.position as string) || ""
        );
        const taskUrl = ((task.item_data?.company_url as string) || "").trim();

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
            `You already have an application for ${position} at ${companyName}`
          );
          return;
        }
      }
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
        location_type: locationType,
        employment_type: employmentType || "",
        date_applied: getLocalDateString(),
        job_description: jobDescription || "",
        notes: jobNotes || "",
      };
    } else if (boardType === "recipe") {
      item_data = {
        recipe_name: recipeName || title,
        name: recipeName || title,
        category: category || "",
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
      icon: icon || undefined,
      icon_color: iconColor || undefined,
      priority: priority || undefined,
      due_date: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
      item_data,
      is_repeatable: isRepeatable || undefined,
      repeat_frequency: isRepeatable ? repeatFrequency : undefined,
      // Timer fields
      timer_duration_minutes: hasTimer
        ? timerUnit === "hours"
          ? timerDuration * 60
          : timerDuration
        : undefined,
      is_urgent_after_timer: hasTimer ? isUrgentAfterTimer : undefined,
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
          // Reset repeatable fields
          setIsRepeatable(false);
          setRepeatFrequency("weekly");
          // Reset timer fields
          setHasTimer(false);
          setTimerDuration(30);
          setTimerUnit("minutes");
          setIsUrgentAfterTimer(false);
          // Reset icon + color
          setIcon(null);
          setIconColor(themeColor);
          // Reset optional sections

          // Reset job tracker fields
          setCompanyName("");
          setCompanyUrl("");
          setPosition("");
          setSalaryRange("");
          setLocation("");
          setLocationType("In-Office");
          setEmploymentType("");
          setJobDescription("");
          setJobNotes("");
          // Reset recipe fields
          setRecipeName("");
          setRecipeUrl("");
          setCategory("");
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
        className="p-6 space-y-6"
      >
        {/* Quick Add from URL - Only for recipe boards (job tracker has it integrated below) */}
        {boardType === "recipe" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              <Link className="w-3.5 h-3.5" />
              Quick add from URL
            </div>
            <Input
              id="task-url"
              type="url"
              value={url}
              onChange={(e) => void handleUrlChange(e.target.value)}
              placeholder="Paste recipe URL to auto-fill..."
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
                className={`flex items-start gap-2 text-xs px-3 py-2 rounded-md ${
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
            {!urlFeedback && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Or fill in the details manually below
              </p>
            )}
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
          <div className="space-y-6">
            {/* Quick Add URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                <Link className="w-3.5 h-3.5" />
                Quick add from URL
              </div>
              <Input
                id="job-url"
                type="url"
                value={url}
                onChange={(e) => void handleUrlChange(e.target.value)}
                placeholder="Paste job posting URL to auto-fill..."
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
                  className={`flex items-start gap-2 text-xs px-3 py-2 rounded-md ${
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
              {!urlFeedback && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Or fill in the details manually below
                </p>
              )}
            </div>

            {/* Core Job Details */}
            <div className="space-y-4">
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
              </div>

              {/* Optional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="salary-range"
                  label="Salary Range (optional)"
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="$100k - $150k"
                />
                <Input
                  id="location"
                  label="Location (optional)"
                  type="text"
                  value={location}
                  onChange={(e) => {
                    const newLocation = e.target.value;
                    setLocation(newLocation);
                    // Auto-detect location type from manual entry
                    setLocationType(detectLocationTypeFromLocationText(newLocation));
                  }}
                  placeholder="San Francisco, CA"
                />
              </div>

              <Select
                id="employment-type"
                label="Employment Type (optional)"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                placeholder="Select type"
                options={[
                  { value: "Full-time", label: "Full-time" },
                  { value: "Part-time", label: "Part-time" },
                  { value: "Contract", label: "Contract" },
                ]}
              />
            </div>

            {/* Additional Context */}
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Textarea
                id="job-description"
                label="Job Description (optional)"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste or type the full job description here..."
                rows={6}
                resize="vertical"
              />
              <Textarea
                id="job-notes"
                label="Notes (optional)"
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                placeholder="Interview notes, contacts, follow-ups..."
                rows={4}
                resize="vertical"
              />
            </div>
          </div>
        )}

        {/* Recipe Specific Fields */}
        {boardType === "recipe" && (
          <div className="space-y-6">
            {/* Core Recipe Details */}
            <div className="space-y-4">
              <Input
                id="recipe-name"
                label="Recipe Name"
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Chocolate Chip Cookies"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  id="prep-time"
                  label="Prep Time"
                  type="text"
                  inputMode="numeric"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="15 min"
                />
                <Input
                  id="cook-time"
                  label="Cook Time"
                  type="text"
                  inputMode="numeric"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="30 min"
                />
                <Input
                  id="total-time"
                  label="Total Time"
                  type="text"
                  inputMode="numeric"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  placeholder="45 min"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  id="category"
                  label="Category (optional)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Select a category..."
                  options={[
                    { value: "Main", label: "Main" },
                    { value: "Side", label: "Side" },
                    { value: "Dessert", label: "Dessert" },
                    { value: "Appetizer", label: "Appetizer" },
                    { value: "Breakfast", label: "Breakfast" },
                    { value: "Soup", label: "Soup" },
                    { value: "Salad", label: "Salad" },
                    { value: "Snack", label: "Snack" },
                    { value: "Beverage", label: "Beverage" },
                  ]}
                />
                <Input
                  id="recipe-url-2"
                  label="Source URL (optional)"
                  type="url"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  placeholder="https://recipe-site.com/..."
                />
              </div>
            </div>

            {/* Recipe Content */}
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Textarea
                id="ingredients"
                label="Ingredients (one per line)"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="2 cups flour&#10;1 cup sugar&#10;2 eggs"
                rows={6}
              />
              <Textarea
                id="instructions"
                label="Instructions (one step per line)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients"
                rows={6}
              />
              <Textarea
                id="recipe-notes"
                label="Notes (optional)"
                value={recipeNotes}
                onChange={(e) => setRecipeNotes(e.target.value)}
                placeholder="Personal notes, modifications..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Optional Fields - Hidden for job tracker */}
        {boardType !== "job_tracker" && (
          <div className="space-y-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2.5">
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
                className="block text-sm font-bold text-primary mb-2.5"
              >
                {isRepeatable ? "Date *" : "Due Date"}
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
                  id="task-due-date"
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

            {/* Scheduling + Appearance */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              {/* Row 1: Repeatable (left) + Timer (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TaskSchedulingControls
                  themeColor={themeColor}
                  dueDate={dueDate}
                  setDueDate={setDueDate}
                  isRepeatable={isRepeatable}
                  setIsRepeatable={setIsRepeatable}
                  repeatFrequency={repeatFrequency}
                  setRepeatFrequency={setRepeatFrequency}
                  hasTimer={hasTimer}
                  setHasTimer={setHasTimer}
                  timerDuration={timerDuration}
                  setTimerDuration={setTimerDuration}
                  timerUnit={timerUnit}
                  setTimerUnit={setTimerUnit}
                  isUrgentAfterTimer={isUrgentAfterTimer}
                  setIsUrgentAfterTimer={setIsUrgentAfterTimer}
                  repeatFrequencySelectId="repeat-frequency"
                  timerDurationSelectId="timer-duration"
                  timerUnitSelectId="timer-unit"
                />
              </div>

              {/* Row 2: Icon (left) + Color (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TaskAppearanceControls
                  icon={icon}
                  setIcon={setIcon}
                  iconColor={iconColor}
                  setIconColor={setIconColor}
                  icons={TASK_ICONS}
                  iconHexInputId="task-icon-hex"
                  iconPickerLabel="Icon"
                />
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Error */}
        {duplicateError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mt-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {duplicateError}
            </p>
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
