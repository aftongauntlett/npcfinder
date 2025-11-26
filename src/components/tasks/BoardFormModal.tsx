/**
 * Board Form Modal
 * Simple modal for creating or editing task boards
 */

import React, { useState, useEffect, useRef } from "react";
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
import type { Board, CreateBoardData } from "../../services/tasksService.types";
import {
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
} from "../../hooks/useTasksQueries";
import { HexColorPicker } from "react-colorful";
import { useTheme } from "../../hooks/useTheme";

interface BoardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  board?: Board; // If provided, edit mode; otherwise create mode
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
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("");
  const [color, setColor] = useState("#9333ea");
  const [isPublic, setIsPublic] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const { themeColor } = useTheme();
  const iconDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

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

  // Populate form when editing
  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || "");
      setIconName(board.icon || "");
      setColor(board.color || "#9333ea");
      setIsPublic(board.is_public || false);
    } else {
      // Reset form for new board
      setName("");
      setDescription("");
      setIconName("");
      setColor("#9333ea");
      setIsPublic(false);
      setShowOptional(false);
    }
  }, [board, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // All boards are Kanban (grid) type with 3 default columns
    const columnConfig = {
      columns: ["To Do", "In Progress", "Done"],
      maxColumns: 4,
    };

    const boardData: CreateBoardData = {
      name,
      description: description || undefined,
      icon: iconName || undefined,
      color,
      board_type: "grid",
      is_public: isPublic,
      column_config: columnConfig,
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
          <input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Daily Tasks, Job Search, Meal Planning"
            required
            maxLength={100}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
            style={
              {
                "--tw-ring-color": themeColor,
              } as React.CSSProperties
            }
            onFocus={(e) => {
              e.currentTarget.style.setProperty("--tw-ring-color", themeColor);
            }}
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
          <textarea
            id="board-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this board for?"
            rows={3}
            maxLength={500}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
            style={
              {
                "--tw-ring-color": themeColor,
              } as React.CSSProperties
            }
            onFocus={(e) => {
              e.currentTarget.style.setProperty("--tw-ring-color", themeColor);
            }}
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
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
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
                          <input
                            type="text"
                            value={color}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow typing # and valid hex characters
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                setColor(value);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
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
                    backgroundColor: isPublic ? themeColor : undefined,
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
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4">
          {/* Delete Button (Edit Mode Only) */}
          {board && !showDeleteConfirm && (
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
                !name.trim() || createBoard.isPending || updateBoard.isPending
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
