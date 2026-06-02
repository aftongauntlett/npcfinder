import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button, Input, Modal, Textarea } from "@/components/shared";
import PrivacyToggle from "@/components/shared/common/PrivacyToggle";
import TagInput from "@/components/shared/common/TagInput";
import { useUpdatePlaylist } from "@/hooks/usePlaylistsQueries";
import { uploadPlaylistIconImage } from "@/lib/playlistIcons";
import type { PlaylistWithMeta } from "@/services/playlistsService";
import PlaylistIconPicker from "./PlaylistIconPicker";

interface EditPlaylistModalProps {
  playlist: PlaylistWithMeta;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPlaylistModal({
  playlist,
  isOpen,
  onClose,
}: EditPlaylistModalProps) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description ?? "");
  const [tags, setTags] = useState<string[]>(playlist.tags);
  const [isPublic, setIsPublic] = useState(!playlist.is_private);
  const [icon, setIcon] = useState(playlist.icon);
  const [iconImageUrl, setIconImageUrl] = useState<string | null>(
    playlist.icon_image_url,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const updatePlaylist = useUpdatePlaylist();

  useEffect(() => {
    if (isOpen) {
      setName(playlist.name);
      setDescription(playlist.description ?? "");
      setTags(playlist.tags);
      setIsPublic(!playlist.is_private);
      setIcon(playlist.icon);
      setIconImageUrl(playlist.icon_image_url);
    }
  }, [isOpen, playlist]);

  const hasChanges =
    name.trim() !== playlist.name ||
    (description.trim() || null) !== playlist.description ||
    JSON.stringify(tags) !== JSON.stringify(playlist.tags) ||
    isPublic === playlist.is_private ||
    icon !== playlist.icon ||
    iconImageUrl !== playlist.icon_image_url;

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadPlaylistIconImage(playlist.owner_id, file);
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

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Playlist" maxWidth="xl">
      <div className="p-6 space-y-4">
        <Input
          id="edit-playlist-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Textarea
          id="edit-playlist-description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            placeholder="Add tag and press Enter…"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press Enter or comma to add. Tags are lowercase.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Icon
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ImagePlus className="w-4 h-4" />
              {isUploadingImage ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={isUploadingImage || updatePlaylist.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void handleImageUpload(file);
                  e.currentTarget.value = "";
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
              Private playlists are automatically removed from your profile Top 8.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="subtle"
            onClick={onClose}
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
            {updatePlaylist.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
