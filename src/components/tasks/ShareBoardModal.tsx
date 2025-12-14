/**
 * Share Board Modal
 *
 * Modal for managing board sharing with connections
 */

import React, { useState } from "react";
import { Users, Trash2, UserPlus, Check, X } from "lucide-react";
import { logger } from "@/lib/logger";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import ConfirmDialog from "../shared/ui/ConfirmDialog";
import {
  useBoardMembers,
  useShareBoard,
  useUnshareBoard,
  useUpdateBoardMemberRole,
} from "../../hooks/useTasksQueries";
import { useUserSearch } from "../../hooks/useUserSearch";
import Input from "../shared/ui/Input";
import type { BoardMemberRole } from "../../services/tasksService.types";

interface ShareBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  boardName?: string;
}

const ShareBoardModal: React.FC<ShareBoardModalProps> = ({
  isOpen,
  onClose,
  boardId,
  boardName,
}) => {
  const [showAddShare, setShowAddShare] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [role, setRole] = useState<BoardMemberRole>("viewer");
  const [confirmUnshare, setConfirmUnshare] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  const { data: members = [], isLoading: sharesLoading } =
    useBoardMembers(boardId);
  const { data: searchResults } = useUserSearch(searchQuery, 1, 10);
  const shareBoard = useShareBoard();
  const unshareBoard = useUnshareBoard();
  const updateMemberRole = useUpdateBoardMemberRole();

  // Filter search results to only show connections not already shared
  const availableUsers = (searchResults?.users || []).filter(
    (user) =>
      user.is_connected &&
      !members.some((member) => member.user_id === user.user_id)
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddShares = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      await shareBoard.mutateAsync({
        boardId,
        userIds: selectedUserIds,
        role,
      });
      setSelectedUserIds([]);
      setSearchQuery("");
      setRole("viewer");
      setShowAddShare(false);
    } catch (error) {
      logger.error("Failed to share board", {
        error,
        boardId,
        userIds: selectedUserIds,
      });
    }
  };

  const handleUnshare = async () => {
    if (!confirmUnshare) return;

    try {
      await unshareBoard.mutateAsync({
        boardId,
        userId: confirmUnshare.userId,
      });
      setConfirmUnshare(null);
    } catch (error) {
      logger.error("Failed to unshare board", {
        error,
        boardId,
        userId: confirmUnshare.userId,
      });
    }
  };

  const handleTogglePermission = async (memberId: string, userId: string, currentRole: BoardMemberRole) => {
    try {
      const nextRole: BoardMemberRole = currentRole === "editor" ? "viewer" : "editor";
      await updateMemberRole.mutateAsync({ memberId, role: nextRole, boardId });
    } catch (error) {
      logger.error("Failed to update board member role", {
        error,
        boardId,
        userId,
      });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Share ${boardName || "Board"}`}
        maxWidth="2xl"
      >
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share this board with your connections. They can view or edit
              based on permissions.
            </p>
          </div>

          {/* Current Shares List */}
          {sharesLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Loading shares...
              </p>
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Shared with ({members.length})
              </h3>
              {members.map((member) => {
                const userName =
                  member.user_profile?.display_name || "Unknown User";
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {userName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.role === "editor" ? "Can edit" : "View only"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleTogglePermission(
                            member.id,
                            member.user_id,
                            member.role
                          )
                        }
                        className="px-3 py-1.5 text-xs font-medium rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {member.role === "editor" ? "Make view-only" : "Allow editing"}
                      </button>
                      <button
                        onClick={() =>
                          setConfirmUnshare({
                            userId: member.user_id,
                            userName: userName,
                          })
                        }
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Remove share"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This board isn't shared with anyone yet
              </p>
            </div>
          )}

          {/* Add Share Section */}
          {!showAddShare ? (
            <Button
              onClick={() => setShowAddShare(true)}
              variant="secondary"
              size="md"
              icon={<UserPlus className="w-4 h-4" />}
              className="w-full"
            >
              Add People
            </Button>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Add People
                </h3>
                <button
                  onClick={() => {
                    setShowAddShare(false);
                    setSearchQuery("");
                    setSelectedUserIds([]);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <Input
                type="text"
                placeholder="Search your connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Permission Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={role === "editor"}
                  onChange={(e) => setRole(e.target.checked ? "editor" : "viewer")}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-primary focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow editing
                </span>
              </label>

              {/* Search Results */}
              {searchQuery && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableUsers.length > 0 ? (
                    availableUsers.map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => handleToggleUser(user.user_id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                          selectedUserIds.includes(user.user_id)
                            ? "bg-primary/10 border-primary/30"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                          {user.display_name}
                        </span>
                        {selectedUserIds.includes(user.user_id) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No connections found
                    </p>
                  )}
                </div>
              )}

              {/* Add Button */}
              {selectedUserIds.length > 0 && (
                <Button
                  onClick={() => void handleAddShares()}
                  disabled={shareBoard.isPending}
                  variant="action"
                  size="md"
                  className="w-full"
                >
                  Add {selectedUserIds.length}{" "}
                  {selectedUserIds.length === 1 ? "person" : "people"}
                </Button>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Unshare Dialog */}
      {confirmUnshare && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmUnshare(null)}
          onConfirm={() => void handleUnshare()}
          title="Remove Share"
          message={`Are you sure you want to stop sharing this board with ${confirmUnshare.userName}? They will lose access immediately.`}
          confirmText="Remove"
          variant="danger"
        />
      )}
    </>
  );
};

export default ShareBoardModal;
