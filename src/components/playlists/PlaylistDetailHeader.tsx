import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ImagePlus,
  Link2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button, ConfirmDialog, Input, Textarea } from "@/components/shared";
import PrivacyToggle from "@/components/shared/common/PrivacyToggle";
import TagInput from "@/components/shared/common/TagInput";
import { useAuth } from "@/contexts/AuthContext";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import {
  usePlaylistShares,
  useSharePlaylist,
  useUnsharePlaylist,
  useUpdatePlaylist,
} from "@/hooks/usePlaylistsQueries";
import { uploadPlaylistIconImage } from "@/lib/playlistIcons";
import type { PlaylistWithMeta } from "@/services/playlistsService";
import { getPlaylistIcon } from "./PlaylistIconPicker";
import PlaylistIconPicker from "./PlaylistIconPicker";

interface PlaylistDetailHeaderProps {
  playlist: PlaylistWithMeta;
  isOwner: boolean;
  canEdit: boolean;
  onDelete: () => void;
  onRequestAddItems: () => void;
  disableAddAction?: boolean;
  activePanel: "none" | "share" | "edit";
  onClosePanel: () => void;
}

/**
 * PlaylistDetailHeader — playlist summary with inline edit/share panels.
 */
export default function PlaylistDetailHeader({
  playlist,
  isOwner,
  canEdit,
  onDelete,
  onRequestAddItems,
  disableAddAction = false,
  activePanel,
  onClosePanel,
}: PlaylistDetailHeaderProps) {
  const { user } = useAuth();
  const updatePlaylist = useUpdatePlaylist();
  const shareMutation = useSharePlaylist();
  const unshareMutation = useUnsharePlaylist();

  const isEditing = activePanel === "edit" && isOwner;
  const isSharing = activePanel === "share";
  const PlaylistSummaryIcon = getPlaylistIcon(playlist.icon);

  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description ?? "");
  const [tags, setTags] = useState<string[]>(playlist.tags);
  const [isPublic, setIsPublic] = useState(!playlist.is_private);
  const [icon, setIcon] = useState(playlist.icon);
  const [iconImageUrl, setIconImageUrl] = useState<string | null>(
    playlist.icon_image_url,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmUnshare, setConfirmUnshare] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  const { data: shares = [], isLoading: isSharesLoading } = usePlaylistShares(
    isSharing ? playlist.id : null,
  );
  const { data: directoryResults } = useUserDirectory(searchQuery, 1, 20);

  useEffect(() => {
    if (!isEditing) {
      setName(playlist.name);
      setDescription(playlist.description ?? "");
      setTags(playlist.tags);
      setIsPublic(!playlist.is_private);
      setIcon(playlist.icon);
      setIconImageUrl(playlist.icon_image_url);
    }
  }, [isEditing, playlist]);

  useEffect(() => {
    if (!isSharing) {
      setSearchQuery("");
      setSelectedUserIds([]);
      setCopiedLink(false);
      setConfirmUnshare(null);
    }
  }, [isSharing]);

  const visibleTags = playlist.tags.slice(0, 6);
  const extraCount = playlist.tags.length - visibleTags.length;

  const existingIds = useMemo(
    () => new Set(shares.map((share) => share.shared_with_user_id)),
    [shares],
  );

  const availableUsers = useMemo(
    () =>
      (directoryResults?.users || []).filter(
        (candidate) =>
          candidate.user_id !== user?.id && !existingIds.has(candidate.user_id),
      ),
    [directoryResults?.users, existingIds, user?.id],
  );

  const hasChanges = useMemo(
    () =>
      name.trim() !== playlist.name ||
      (description.trim() || null) !== playlist.description ||
      JSON.stringify(tags) !== JSON.stringify(playlist.tags) ||
      isPublic === playlist.is_private ||
      icon !== playlist.icon ||
      iconImageUrl !== playlist.icon_image_url,
    [description, icon, iconImageUrl, isPublic, name, playlist, tags],
  );

  const shareUrl =
    playlist.slug && typeof window !== "undefined"
      ? `${window.location.origin}/app/playlists/${playlist.slug}`
      : "";

  const handleImageUpload = async (file: File | null) => {
    if (!file || !isOwner) return;
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadPlaylistIconImage(
        playlist.owner_id,
        file,
      );
      setIconImageUrl(uploadedUrl);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    await updatePlaylist.mutateAsync({
      playlistId: playlist.id,
      updates: {
        name: trimmedName,
        description: description.trim() || null,
        tags,
        icon,
        icon_image_url: iconImageUrl,
        is_private: !isPublic,
      },
    });

    onClosePanel();
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleShare = async () => {
    if (selectedUserIds.length === 0) return;

    await shareMutation.mutateAsync({
      playlistId: playlist.id,
      userIds: selectedUserIds,
    });

    setSelectedUserIds([]);
    setSearchQuery("");
  };

  const handleUnshare = async () => {
    if (!confirmUnshare) return;

    await unshareMutation.mutateAsync({
      playlistId: playlist.id,
      userId: confirmUnshare.userId,
    });

    setConfirmUnshare(null);
  };

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

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-[6rem_minmax(0,1fr)_auto] items-start gap-4 md:gap-5">
        <div className="w-20 h-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-primary/5 dark:bg-primary-light/10 overflow-hidden flex items-center justify-center shrink-0">
          {playlist.icon_image_url ? (
            <img
              src={playlist.icon_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <PlaylistSummaryIcon className="w-9 h-9 text-primary dark:text-primary-light" />
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed min-h-[1.25rem]">
            {playlist.description || "No description yet."}
          </p>

          {playlist.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary dark:text-primary-light"
                >
                  {tag}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                  +{extraCount} more
                </span>
              )}
            </div>
          )}

          {!isOwner && playlist.owner_display_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              by {playlist.owner_display_name}
            </p>
          )}
        </div>

        <div className="flex items-start justify-end">
          {canEdit && (
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={onRequestAddItems}
              disabled={disableAddAction}
            >
              Add Items
            </Button>
          )}
        </div>
      </div>

      {isSharing && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-5">
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
                  availableUsers.map((candidate) => {
                    const selected = selectedUserIds.includes(
                      candidate.user_id,
                    );

                    return (
                      <button
                        key={candidate.user_id}
                        type="button"
                        onClick={() => toggleUser(candidate.user_id)}
                        className={`w-full rounded-lg border p-2 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {candidate.display_name ||
                              candidate.username ||
                              "Unknown User"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            @{candidate.username}
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

          <div className="flex justify-end pt-1">
            <Button
              variant="subtle"
              onClick={onClosePanel}
              disabled={shareMutation.isPending || unshareMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isOwner && isEditing && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem] gap-4 lg:gap-6">
            <div className="space-y-4">
              <Input
                id={`playlist-name-${playlist.id}`}
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <Textarea
                id={`playlist-description-${playlist.id}`}
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Optional description"
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </label>
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  placeholder="Add tag and press Enter..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter or comma to add. Tags are lowercase.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Icon
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ImagePlus className="w-4 h-4" />
                    {isUploadingImage ? "Uploading image..." : "Upload image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={isUploadingImage || updatePlaylist.isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        void handleImageUpload(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {iconImageUrl && (
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      icon={<X className="w-4 h-4" />}
                      onClick={() => setIconImageUrl(null)}
                      disabled={updatePlaylist.isPending}
                    >
                      Remove image
                    </Button>
                  )}
                </div>
                <PlaylistIconPicker
                  value={icon}
                  onChange={setIcon}
                  disabled={updatePlaylist.isPending || isUploadingImage}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Uploaded image is used first. Icon picker is fallback.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visibility
                </label>
                <PrivacyToggle
                  isPublic={isPublic}
                  onChange={setIsPublic}
                  variant="switch"
                  size="sm"
                  align="right"
                />
                {!isPublic && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Private playlists are automatically removed from your
                    profile Top 8.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={onDelete}
              disabled={updatePlaylist.isPending || isUploadingImage}
            >
              Delete Playlist
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="subtle"
                onClick={onClosePanel}
                disabled={updatePlaylist.isPending || isUploadingImage}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSave()}
                disabled={
                  !name.trim() ||
                  !hasChanges ||
                  updatePlaylist.isPending ||
                  isUploadingImage
                }
              >
                {updatePlaylist.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
