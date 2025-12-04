/**
 * Board Form Modal
 * Simple modal for creating or editing task boards
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Palette,
  ChevronDown,
  Briefcase,
  ShoppingCart,
  Heart,
  BookOpen,
  Home,
  Dumbbell,
  Plane,
  DollarSign,
  Code,
  Music,
  Camera,
  Star,
  Target,
  CheckSquare,
  Calendar,
  Users,
  Package,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import type { Board, CreateBoardData } from "../../services/tasksService.types";
import {
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
  useBoards,
} from "../../hooks/useTasksQueries";
import { HexColorPicker } from "react-colorful";
import { useTheme } from "../../hooks/useTheme";
import { getTemplate } from "../../utils/boardTemplates";
import type { TemplateType } from "../../utils/boardTemplates";

interface BoardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  board?: Board; // If provided, edit mode; otherwise create mode
  preselectedTemplate?: TemplateType; // Pre-select template type (for template-specific views)
}

const ICON_OPTIONS = [
  { icon: Briefcase, label: "Briefcase" },
  { icon: ShoppingCart, label: "Shopping" },
  { icon: Heart, label: "Health" },
  { icon: BookOpen, label: "Reading" },
  { icon: Home, label: "Home" },
  { icon: Dumbbell, label: "Fitness" },
  { icon: Plane, label: "Travel" },
  { icon: DollarSign, label: "Finance" },
  { icon: Code, label: "Development" },
  { icon: Music, label: "Music" },
  { icon: Camera, label: "Creative" },
  { icon: Star, label: "Favorites" },
  { icon: Target, label: "Goals" },
  { icon: CheckSquare, label: "Tasks" },
  { icon: Calendar, label: "Events" },
  { icon: Users, label: "Team" },
  { icon: Package, label: "Projects" },
  { icon: TrendingUp, label: "Growth" },
  { icon: Lightbulb, label: "Ideas" },
];

const BoardFormModal: React.FC<BoardFormModalProps> = ({
  isOpen,
  onClose,
  board,
  preselectedTemplate,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("");
  const [color, setColor] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateType, setTemplateType] = useState<string>("markdown");
  const [nameError, setNameError] = useState<string>("");
  const [isNameAutoFilled, setIsNameAutoFilled] = useState(false);

  const { themeColor } = useTheme();
  const { data: boards = [] } = useBoards();
  const iconDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  // Generate unique board name by checking for duplicates and adding number suffix
  const generateUniqueBoardName = useCallback(
    (baseName: string): string => {
      const existingNames = boards.map((b) => b.name.toLowerCase());

      // If base name doesn't exist, return it
      if (!existingNames.includes(baseName.toLowerCase())) {
        return baseName;
      }

      // Find the next available number
      let counter = 2;
      let uniqueName = `${baseName} ${counter}`;

      while (existingNames.includes(uniqueName.toLowerCase())) {
        counter++;
        uniqueName = `${baseName} ${counter}`;
      }

      return uniqueName;
    },
    [boards]
  ); // Validate board name for duplicates
  const validateBoardName = (boardName: string): string => {
    if (!boardName.trim()) {
      return "Board name is required";
    }

    // Skip validation if editing the same board
    if (board && boardName.toLowerCase() === board.name.toLowerCase()) {
      return "";
    }

    // Check for duplicate names
    const isDuplicate = boards.some(
      (b) =>
        b.name.toLowerCase() === boardName.toLowerCase() && b.id !== board?.id
    );

    if (isDuplicate) {
      return "A board with this name already exists";
    }

    return "";
  };

  // Close icon dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconDropdownRef.current &&
        !iconDropdownRef.current.contains(event.target as Node)
      ) {
        setShowIconDropdown(false);
      }
    };

    if (showIconDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showIconDropdown]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        templateDropdownRef.current &&
        !templateDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTemplateDropdown(false);
      }
    };

    if (showTemplateDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTemplateDropdown]);
  // Populate form when editing
  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || "");
      setIconName(board.icon || "");
      setColor(board.color || themeColor);
      setIsPublic(board.is_public || false);
      setTemplateType((board.template_type as string) || "kanban");
      setNameError("");
      setIsNameAutoFilled(false);
    } else {
      // Reset form for new board - use preselected template or default
      const defaultTemplate =
        preselectedTemplate || ("markdown" as TemplateType);
      const template = getTemplate(defaultTemplate);
      const uniqueName = generateUniqueBoardName(template.name);
      setName(uniqueName);
      setDescription(template.description);
      setIconName("");
      setColor(themeColor);
      setIsPublic(false);
      setTemplateType(defaultTemplate);
      setNameError("");
      setIsNameAutoFilled(true);
    }
  }, [board, isOpen, generateUniqueBoardName, themeColor, preselectedTemplate]);

  // Handle template type change - auto-fill name and description
  const handleTemplateChange = (newTemplateType: string) => {
    setTemplateType(newTemplateType);

    // Don't auto-fill if editing existing board
    if (board) return;

    const template = getTemplate(newTemplateType as TemplateType);
    const uniqueName = generateUniqueBoardName(template.name);

    setName(uniqueName);
    setDescription(template.description);
    setIsNameAutoFilled(true);
    setNameError("");
  };

  // Handle name change - clear auto-fill flag and validate
  const handleNameChange = (newName: string) => {
    setName(newName);
    setIsNameAutoFilled(false);
    const error = validateBoardName(newName);
    setNameError(error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name one more time before submission
    const error = validateBoardName(name);
    if (error) {
      setNameError(error);
      return;
    }

    // Determine board_type based on template
    const boardType =
      templateType === "recipe"
        ? "list"
        : templateType === "job_tracker"
        ? "job_tracker"
        : templateType === "markdown"
        ? "list"
        : "grid";

    const boardData: CreateBoardData = {
      name,
      description: description || undefined,
      icon: iconName || undefined,
      color,
      board_type: boardType,
      template_type: templateType,
      is_public: isPublic,
    };

    if (board) {
      void updateBoard
        .mutateAsync({
          boardId: board.id,
          updates: boardData,
        })
        .then(() => {
          onClose();
        })
        .catch((error) => {
          console.error("Failed to save board:", error);
        });
    } else {
      void createBoard
        .mutateAsync(boardData)
        .then(() => {
          onClose();
        })
        .catch((error) => {
          console.error("Failed to save board:", error);
        });
    }
  };

  const handleDelete = () => {
    if (!board) return;

    void deleteBoard
      .mutateAsync(board.id)
      .then(() => {
        onClose();
      })
      .catch((error) => {
        console.error("Failed to delete board:", error);
      });
  };

  if (!isOpen) return null;

  const selectedIcon = ICON_OPTIONS.find((opt) => opt.label === iconName);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={board ? "Edit Board" : "Create New Board"}
      maxWidth="2xl"
      closeOnBackdropClick={true}
    >
      {/* Delete Confirmation Banner */}
      {showDeleteConfirm && board && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800 dark:text-red-200">
              Are you sure? All tasks will be permanently removed.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleteBoard.isPending}
              >
                {deleteBoard.isPending ? "Deleting..." : "Yes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="board-name"
            className="block text-sm font-medium text-primary mb-2.5"
          >
            Board Name *
          </label>
          <Input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Daily Tasks, Job Search, Meal Planning"
            required
            maxLength={100}
            autoComplete="off"
            error={nameError}
            helperText={
              !nameError && isNameAutoFilled
                ? "This name can be edited to anything you'd like"
                : undefined
            }
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="board-description"
            className="block text-sm font-medium text-primary mb-2.5"
          >
            Description
          </label>
          <Textarea
            id="board-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this board for?"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Template Type Selection */}
        <div>
          <label
            htmlFor="board-template"
            className="block text-sm font-medium text-primary mb-2.5"
          >
            Board Template *
          </label>
          <div ref={templateDropdownRef} className="relative">
            <button
              type="button"
              onClick={() =>
                !preselectedTemplate &&
                setShowTemplateDropdown(!showTemplateDropdown)
              }
              disabled={!!preselectedTemplate || !!board}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                preselectedTemplate || board
                  ? "bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-60"
                  : "bg-white dark:bg-gray-700/50"
              }`}
              style={
                {
                  "--tw-ring-color": themeColor,
                } as React.CSSProperties
              }
            >
              <span>
                {templateType === "markdown" && "To-Do List (Default)"}
                {templateType === "kanban" && "Kanban Board"}
                {templateType === "job_tracker" && "Job Applications"}
                {templateType === "recipe" && "Recipe Collection"}
              </span>
              {!preselectedTemplate && !board && (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showTemplateDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[300px] overflow-y-auto">
                {[
                  {
                    value: "markdown",
                    label: "To-Do List (Default)",
                    desc: "Markdown-style list with support for bold, bullets, and formatting",
                  },
                  {
                    value: "job_tracker",
                    label: "Job Applications",
                    desc: "Quick add via URL and track job applications with detailed fields",
                  },
                  {
                    value: "recipe",
                    label: "Recipe Collection",
                    desc: "Quick add via URL and organize recipes with ingredients and instructions",
                  },
                  {
                    value: "kanban",
                    label: "Kanban Board",
                    desc: "Drag-and-drop style board for organizing tasks in columns",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleTemplateChange(option.value);
                      setShowTemplateDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left transition-colors focus:outline-none bg-transparent ${
                      templateType === option.value
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      {templateType === option.value && (
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {option.desc}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {preselectedTemplate || board
              ? "Template type cannot be changed"
              : "Choose how this board will display and organize items"}
          </p>
        </div>

        {/* Icon & Color */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2.5">
            Icon & Color
          </label>
          <div className="grid grid-cols-[1fr,auto] gap-3">
            {/* Icon Dropdown */}
            <div className="relative" ref={iconDropdownRef}>
              <button
                type="button"
                onClick={() => setShowIconDropdown(!showIconDropdown)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {selectedIcon ? (
                    <>
                      <selectedIcon.icon
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color }}
                      />
                      <span>{selectedIcon.label}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Select an icon</span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
              {showIconDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIconName("");
                      setShowIconDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="text-gray-500">No icon</span>
                  </button>
                  {ICON_OPTIONS.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setIconName(label);
                        setShowIconDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Icon
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color }}
                      />
                      <span className="text-gray-900 dark:text-white">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color Picker Button */}
            <div className="relative" ref={colorPickerRef}>
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                aria-label="Pick icon color"
                title="Choose icon color"
              >
                <Palette className="w-6 h-6" style={{ color }} />
              </button>
              {showColorPicker && (
                <div className="absolute right-0 bottom-full mb-2 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon Color
                  </p>
                  {/* Color picker */}
                  <HexColorPicker color={color} onChange={setColor} />
                  {/* Hex input */}
                  <div className="mt-2">
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow typing # and valid hex characters
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          setColor(value);
                        }
                      }}
                      inputClassName="text-xs font-mono"
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label
              htmlFor="board-privacy"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Make board public
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Others can view this board
            </p>
          </div>
          <button
            type="button"
            id="board-privacy"
            onClick={() => setIsPublic(!isPublic)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{
              backgroundColor: isPublic ? themeColor : "#d1d5db",
            }}
            aria-pressed={isPublic}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4">
          {/* Delete Button (Edit Mode Only, except for starter boards) */}
          {board &&
            !showDeleteConfirm &&
            (() => {
              const isStarter =
                (board.field_config as Record<string, unknown>)?.starter ===
                true;
              return !isStarter;
            })() && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete Board
              </Button>
            )}

          {/* Spacer when no delete button */}
          {!board && <div />}

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
                !name.trim() ||
                !!nameError ||
                createBoard.isPending ||
                updateBoard.isPending
              }
            >
              {board ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BoardFormModal;
