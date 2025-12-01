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
import CustomDropdown from "../ui/CustomDropdown";
import type { CreateTaskData } from "../../services/tasksService.types";
import { useCreateTask } from "../../hooks/useTasksQueries";
import { useUrlMetadata } from "../../hooks/useUrlMetadata";
import { PRIORITY_OPTIONS } from "../../utils/taskConstants";
import { Link, Loader2 } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

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
  console.log("🔍 CreateTaskModal Props:", { isOpen, boardId, boardType });

  const { themeColor } = useTheme();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | null>(
    null
  );
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tags, setTags] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  // Job tracker specific fields
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [position, setPosition] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
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

    // Auto-fill when URL looks valid (has http/https)
    if (value.match(/^https?:\/\/.+/)) {
      console.log("📡 Fetching metadata for URL:", value);
      const metadata = await fetchMetadata(value);
      console.log("📦 Metadata received:", metadata);
      if (metadata) {
        // Auto-fill from job posting
        if (metadata.jobPosting) {
          console.log("💼 Job posting data:", metadata.jobPosting);
          const {
            company,
            position: jobPosition,
            salary,
            location: jobLocation,
            employmentType: empType,
          } = metadata.jobPosting;
          if (jobPosition) {
            setTitle(jobPosition);
            setPosition(jobPosition);
          }
          if (company) setCompanyName(company);
          if (salary) setSalaryRange(salary);
          if (jobLocation) setLocation(jobLocation);
          if (empType) setEmploymentType(empType);
          if (value) setCompanyUrl(value);
        }
        // Auto-fill from recipe
        else if (metadata.recipe) {
          const {
            name,
            description: recipeDesc,
            ingredients: recipeIngredients,
            instructions: recipeInstructions,
            prepTime: recipePrepTime,
            cookTime: recipeCookTime,
            totalTime: recipeTotalTime,
            servings: recipeServings,
          } = metadata.recipe;
          if (name) {
            setTitle(name);
            setRecipeName(name);
          }
          if (recipeDesc) {
            setDescription(recipeDesc);
          }
          if (recipeIngredients)
            setIngredients(
              Array.isArray(recipeIngredients)
                ? recipeIngredients.join("\n")
                : recipeIngredients
            );
          if (recipeInstructions)
            setInstructions(
              Array.isArray(recipeInstructions)
                ? recipeInstructions.join("\n")
                : recipeInstructions
            );
          if (recipePrepTime) setPrepTime(recipePrepTime);
          if (recipeCookTime) setCookTime(recipeCookTime);
          if (recipeTotalTime) setTotalTime(recipeTotalTime);
          if (recipeServings) setServings(recipeServings.toString());
          if (value) setRecipeUrl(value);
        }
        // General metadata fallback
        else {
          console.log("📄 Using general metadata fallback:", {
            title: metadata.title,
            description: metadata.description,
          });
          if (metadata.title && !title) setTitle(metadata.title);
          if (metadata.description && !description)
            setDescription(metadata.description);
        }
      } else {
        console.log("⚠️ No metadata returned");
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
        date_applied: new Date().toISOString().split("T")[0],
        notes: jobNotes || description || "",
        status: status,
        timeline: [
          {
            date: new Date().toISOString().split("T")[0],
            status: "Applied",
            label: "Date Applied",
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
          setTags("");
          setShowOptional(false);
          // Reset job tracker fields
          setCompanyName("");
          setCompanyUrl("");
          setPosition("");
          setSalaryRange("");
          setLocation("");
          setEmploymentType("");
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
        console.error("Failed to create task:", error);
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
                placeholder="Paste a recipe URL..."
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

        {/* Title - Hidden for job tracker and recipe since they have their own fields */}
        {boardType !== "job_tracker" && boardType !== "recipe" && (
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
        )}

        {/* Description - Hidden for job tracker (uses Notes field instead) */}
        {boardType !== "job_tracker" && (
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
              <div className="relative">
                <input
                  id="job-url"
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste job posting URL to auto-fill details..."
                  className="block w-full rounded-lg border bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 pr-10 focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: `${themeColor}60`,
                    outlineColor: themeColor,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${themeColor}60`;
                  }}
                />
                {urlLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: themeColor }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Or fill in the details manually below
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="company-name"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Company Name *
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company name"
                  required
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    outlineColor: themeColor,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColor;
                    e.target.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Position *
                </label>
                <input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Software Engineer"
                  required
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    outlineColor: themeColor,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColor;
                    e.target.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
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
                  placeholder="$100k - $150k"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    outlineColor: themeColor,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColor;
                    e.target.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
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
                  placeholder="San Francisco, CA"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    outlineColor: themeColor,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColor;
                    e.target.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
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
              <CustomDropdown
                id="status"
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  "Applied",
                  "Phone Screen",
                  "Interview - Round 1",
                  "Interview - Round 2",
                  "Interview - Round 3",
                  "Offer Received",
                  "Accepted",
                  "Rejected",
                  "Declined",
                  "No Response",
                ]}
                themeColor={themeColor}
              />
            </div>
            <div>
              <label
                htmlFor="job-description"
                className="block text-sm font-medium text-primary mb-2"
              >
                Job Description
              </label>
              <textarea
                id="job-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the role..."
                rows={4}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                style={{
                  outlineColor: themeColor,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeColor;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>
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
                placeholder="Interview notes, contacts, follow-ups, etc."
                rows={4}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                style={{
                  outlineColor: themeColor,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeColor;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>
          </div>
        )}

        {/* Recipe Specific Fields */}
        {boardType === "recipe" && (
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
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
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
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>
          </div>
        )}

        {/* Optional Fields Accordion - Hidden for job tracker */}
        {boardType !== "job_tracker" && (
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
                : !title.trim())
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
