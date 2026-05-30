import { useMemo, useState } from "react";
import { Check, Link2, Trash2, UserPlus, Users } from "lucide-react";
import { Button, ConfirmDialog, Input, Modal } from "@/components/shared";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePlaylistShares,
  useSharePlaylist,
  useUnsharePlaylist,
} from "@/hooks/usePlaylistsQueries";

interface SharePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  playlistName: string;
  playlistSlug?: string;
}

export default function SharePlaylistModal({
  isOpen,
  onClose,
  playlistId,
  playlistName,
  playlistSlug,
}: SharePlaylistModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmUnshare, setConfirmUnshare] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  const { data: shares = [], isLoading: isSharesLoading } = usePlaylistShares(
    isOpen ? playlistId : null,
  );
  const { data: directoryResults } = useUserDirectory(searchQuery, 1, 20);

  const shareMutation = useSharePlaylist();
  const unshareMutation = useUnsharePlaylist();

  const existingIds = useMemo(
    () => new Set(shares.map((share) => share.shared_with_user_id)),
    [shares],
  );

  const availableUsers = (directoryResults?.users || []).filter(
    (candidate) =>
      candidate.user_id !== user?.id && !existingIds.has(candidate.user_id),
  );

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleShare = async () => {
    if (selectedUserIds.length === 0) return;

    await shareMutation.mutateAsync({
      playlistId,
      userIds: selectedUserIds,
    });

    setSelectedUserIds([]);
    setSearchQuery("");
  };

  const handleUnshare = async () => {
    if (!confirmUnshare) return;

    await unshareMutation.mutateAsync({
      playlistId,
      userId: confirmUnshare.userId,
    });

    setConfirmUnshare(null);
  };

  const shareUrl =
    playlistSlug && typeof window !== "undefined"
      ? `${window.location.origin}/app/playlists/${playlistSlug}`
      : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1200);
    } catch {
      setCopiedLink(false);
    }
  };

  const close = () => {
    setSearchQuery("");
    setSelectedUserIds([]);
    setCopiedLink(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={`Share ${playlistName}`}
        maxWidth="2xl"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share with anyone in the app by name or username. Shared users can
              view only.
            </p>
          </div>

          {shareUrl && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {shareUrl}
              </p>
              <Button
                variant="subtle"
                size="sm"
                icon={
                  copiedLink ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )
                }
                onClick={() => void handleCopyLink()}
              >
                {copiedLink ? "Copied" : "Copy Link"}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Input
              label="Invite users"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search connected users"
            />

            {searchQuery.trim().length > 0 && (
              <div className="max-h-44 overflow-y-auto space-y-2">
                {availableUsers.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No users found.
                  </div>
                ) : (
                  availableUsers.map((user) => {
                    const selected = selectedUserIds.includes(user.user_id);

                    return (
                      <button
                        key={user.user_id}
                        type="button"
                        onClick={() => toggleUser(user.user_id)}
                        className={`w-full rounded-lg border p-2 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.display_name ||
                              user.username ||
                              "Unknown User"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </span>
                          {selected && (
                            <span className="text-xs text-primary">
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="secondary"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => void handleShare()}
                disabled={
                  selectedUserIds.length === 0 || shareMutation.isPending
                }
              >
                {shareMutation.isPending ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Shared users
            </h3>

            {isSharesLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading shares...
              </div>
            ) : shares.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No shares yet.
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">
                      {share.user_profile?.display_name || "Unknown User"}
                    </span>

                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() =>
                        setConfirmUnshare({
                          userId: share.shared_with_user_id,
                          userName:
                            share.user_profile?.display_name || "Unknown User",
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmUnshare}
        onClose={() => setConfirmUnshare(null)}
        onConfirm={() => void handleUnshare()}
        title="Remove share"
        message={`Remove ${confirmUnshare?.userName || "this user"} from this playlist?`}
        confirmText={unshareMutation.isPending ? "Removing..." : "Remove"}
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
