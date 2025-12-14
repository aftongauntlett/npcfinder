/**
 * Share Media List Modal
 *
 * Mirrors the board sharing UX (invite friends with view/edit permissions).
 */

import React, { useMemo, useState } from "react";
import { Users, Trash2, UserPlus } from "lucide-react";
import { logger } from "@/lib/logger";
import { Button, ConfirmDialog, Input, Modal } from "@/components/shared";
import { useUserSearch } from "@/hooks/useUserSearch";
import {
  useMediaListMembers,
  useShareMediaList,
  useUnshareMediaList,
  useUpdateMediaListMemberRole,
} from "@/hooks/useMediaListsQueries";
import type { MediaDomain } from "@/services/mediaListsService.types";

interface ShareMediaListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName?: string;
  domain: MediaDomain;
}

const ShareMediaListModal: React.FC<ShareMediaListModalProps> = ({
  isOpen,
  onClose,
  listId,
  listName,
  domain,
}) => {
  const [showAddShare, setShowAddShare] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [confirmUnshare, setConfirmUnshare] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  const { data: members = [], isLoading: membersLoading } =
    useMediaListMembers(listId);
  const { data: searchResults } = useUserSearch(searchQuery, 1, 10);

  const shareList = useShareMediaList(domain);
  const unshareList = useUnshareMediaList(domain);
  const updateRole = useUpdateMediaListMemberRole(domain);

  const existingSharedUserIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  );

  const availableUsers = (searchResults?.users || []).filter(
    (user) => user.is_connected && !existingSharedUserIds.has(user.user_id)
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
      await shareList.mutateAsync({
        listId,
        userIds: selectedUserIds,
        role: canEdit ? "editor" : "viewer",
      });
      setSelectedUserIds([]);
      setSearchQuery("");
      setCanEdit(false);
      setShowAddShare(false);
    } catch (error) {
      logger.error("Failed to share list", { error, listId, userIds: selectedUserIds });
    }
  };

  const handleUnshare = async () => {
    if (!confirmUnshare) return;

    try {
      await unshareList.mutateAsync({
        listId,
        userId: confirmUnshare.userId,
      });
      setConfirmUnshare(null);
    } catch (error) {
      logger.error("Failed to unshare list", { error, listId, userId: confirmUnshare.userId });
    }
  };

  const handleTogglePermission = async (memberId: string, currentRole: string) => {
    try {
      await updateRole.mutateAsync({
        memberId,
        listId,
        role: currentRole === "editor" ? "viewer" : "editor",
      });
    } catch (error) {
      logger.error("Failed to update list permissions", { error, listId, memberId });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Share ${listName || "List"}`}
        maxWidth="2xl"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Invite specific friends with view-only or editing access.
            </p>
          </div>

          {membersLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading invites...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Invited ({members.length})
              </h3>
              {members.map((member) => {
                const userName = member.user_profile?.display_name || "Unknown User";
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {userName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.role === "editor" ? "Can edit" : "View only"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePermission(member.id, member.role)}
                        className="px-3 py-1.5 text-xs font-medium rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {member.role === "editor" ? "Make view-only" : "Allow editing"}
                      </button>
                      <button
                        onClick={() =>
                          setConfirmUnshare({
                            userId: member.user_id,
                            userName,
                          })
                        }
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Remove invite"
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
                This list isn't shared with anyone yet
              </p>
            </div>
          )}

          {!showAddShare ? (
            <Button
              onClick={() => setShowAddShare(true)}
              variant="secondary"
              size="md"
              icon={<UserPlus className="w-4 h-4" />}
              className="w-full"
            >
              Invite People
            </Button>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Invite People
                </h3>
                <button
                  onClick={() => {
                    setShowAddShare(false);
                    setSelectedUserIds([]);
                    setSearchQuery("");
                    setCanEdit(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <Input
                label="Search friends"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a name..."
              />

              {searchQuery.trim() && availableUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No connected users found.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers.map((user) => {
                    const selected = selectedUserIds.includes(user.user_id);
                    return (
                      <button
                        key={user.user_id}
                        onClick={() => handleToggleUser(user.user_id)}
                        className={`w-full text-left p-2 rounded border transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.display_name || "Unknown User"}
                          </span>
                          {selected && (
                            <span className="text-xs text-primary">Selected</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  Allow editing
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowAddShare(false);
                      setSelectedUserIds([]);
                      setSearchQuery("");
                      setCanEdit(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddShares}
                    disabled={selectedUserIds.length === 0 || shareList.isPending}
                  >
                    Invite
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmUnshare}
        onClose={() => setConfirmUnshare(null)}
        onConfirm={handleUnshare}
        title="Remove invite"
        message={`Remove ${confirmUnshare?.userName || "this user"} from this list?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default ShareMediaListModal;
