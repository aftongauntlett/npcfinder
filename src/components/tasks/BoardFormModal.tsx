/**
 * Board Form Modal
 * Simple modal for creating or editing task boards
 */

import React, { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Share2 } from "lucide-react";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import ConfirmationModal from "../shared/ui/ConfirmationModal";
import ShareBoardModal from "./ShareBoardModal";
import type { Board, CreateBoardData } from "../../services/tasksService.types";
import {
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
  useBoards,
  useBoardMembers,
} from "../../hooks/useTasksQueries";
import PrivacyToggle from "../shared/common/PrivacyToggle";
import { getBoardTypeFromTemplate } from "../../utils/boardTemplates";
import type { TemplateType } from "../../utils/boardTemplates";

interface BoardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  board?: Board; // If provided, edit mode; otherwise create mode
  preselectedTemplate?: TemplateType; // Pre-select template type (for template-specific views)
}

const BoardFormModal: React.FC<BoardFormModalProps> = ({
  isOpen,
  onClose,
  board,
  preselectedTemplate,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [nameError, setNameError] = useState<string>("");
  const [isNameAutoFilled, setIsNameAutoFilled] = useState(false);

  const { data: boards = [] } = useBoards();
  const { data: members = [] } = useBoardMembers(board?.id || "");

  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  const effectiveTemplateType = board?.template_type || preselectedTemplate;
  const isJobTracker = effectiveTemplateType === "job_tracker";
  const isRecipe = effectiveTemplateType === "recipe";

  // Validate board name for duplicates
  const validateBoardName = (boardName: string): string => {
    if (!boardName.trim()) {
      return "Board name is required";
    }

    // Skip validation if editing the same board
    if (
      board &&
      board.name &&
      boardName.toLowerCase() === board.name.toLowerCase()
    ) {
      return "";
    }

    // Check for duplicate names
    const isDuplicate = boards.some(
      (b) =>
        b.name &&
        b.name.toLowerCase() === boardName.toLowerCase() &&
        b.id !== board?.id
    );

    if (isDuplicate) {
      return "A board with this name already exists";
    }

    return "";
  };


  // Populate form when editing
  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || "");
      setIsPublic(isJobTracker ? false : board.is_public || false);
      setNameError("");
      setIsNameAutoFilled(false);
    } else {
      // Reset form for new board
      setName("");
      setDescription("");
      setIsPublic(false);
      setNameError("");
      setIsNameAutoFilled(false);
    }
  }, [board, isOpen, isJobTracker]);



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

    // Determine board_type and template_type from edit or preselected template
    const templateType = (board?.template_type || preselectedTemplate || "kanban") as TemplateType;
    // For kanban/markdown, board_type is inferred automatically
    const boardType = getBoardTypeFromTemplate(templateType);

    const boardData: CreateBoardData = {
      name,
      description: description || undefined,
      board_type: boardType,
      template_type: templateType,
      ...(isJobTracker ? {} : { is_public: isPublic }),
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
          logger.error("Failed to update board", { error, boardId: board.id });
        });
    } else {
      void createBoard
        .mutateAsync(boardData)
        .then(() => {
          onClose();
        })
        .catch((error) => {
          logger.error("Failed to create board", { error });
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
        logger.error("Failed to delete board", { error, boardId: board.id });
      });
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={board ? "Edit Board" : "Create New Board"}
        maxWidth="2xl"
        closeOnBackdropClick={true}
      >
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="board-name"
              className="block text-sm font-bold text-primary mb-2.5"
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
              className="block text-sm font-bold text-primary mb-2.5"
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

          {/* Privacy Toggle */}
          {!isJobTracker && (
            <PrivacyToggle
              variant="switch"
              size="sm"
              isPublic={isPublic}
              onChange={setIsPublic}
              showDescription
              contextLabel="board"
            />
          )}

          {/* Sharing Section - Only for existing non-recipe boards, and never for job tracker boards */}
          {board && !isRecipe && !isJobTracker && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Sharing
                    </h3>
                    {members.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Shared with {members.length}{" "}
                        {members.length === 1 ? "person" : "people"}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                >
                  Manage
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4">
            {/* Delete Button (Edit Mode Only, except for starter boards) */}
            {board &&
              !showDeleteModal &&
              (() => {
                const isStarter =
                  (board.field_config as Record<string, unknown>)?.starter ===
                  true;
                return !isStarter;
              })() && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDeleteModal(true)}
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

      {/* Delete Confirmation Modal */}
      {board && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Board?"
          message="Are you sure you want to delete this board? All tasks will be permanently removed."
          confirmText="Delete Board"
          variant="danger"
          isLoading={deleteBoard.isPending}
        />
      )}

      {/* Share Board Modal */}
      {board && (
        <ShareBoardModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          boardId={board.id}
          boardName={board.name}
        />
      )}
    </>
  );
};

export default BoardFormModal;
