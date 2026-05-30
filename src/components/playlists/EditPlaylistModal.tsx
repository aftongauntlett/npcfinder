import { useEffect, useState } from "react";
import { Button, Input, Modal, Textarea } from "@/components/shared";
import PrivacyToggle from "@/components/shared/common/PrivacyToggle";
import TagInput from "@/components/shared/common/TagInput";
import { useUpdatePlaylist } from "@/hooks/usePlaylistsQueries";
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
  const updatePlaylist = useUpdatePlaylist();

  // Reset form when playlist changes or modal reopens
  useEffect(() => {
    if (isOpen) {
      setName(playlist.name);
      setDescription(playlist.description ?? "");
      setTags(playlist.tags);
      setIsPublic(!playlist.is_private);
      setIcon(playlist.icon);
    }
  }, [isOpen, playlist]);

  const hasChanges =
    name.trim() !== playlist.name ||
    (description.trim() || null) !== playlist.description ||
    JSON.stringify(tags) !== JSON.stringify(playlist.tags) ||
    isPublic === playlist.is_private ||
    icon !== playlist.icon;

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
        is_private: !isPublic,
      },
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Playlist"
      maxWidth="xl"
    >
      <div className="p-6 space-y-4">
        <Input
          id="edit-playlist-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Icon
          </label>
          <PlaylistIconPicker
            value={icon}
            onChange={setIcon}
            disabled={updatePlaylist.isPending}
          />
        </div>

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
              Private playlists are automatically removed from your profile Top
              8.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={!name.trim() || !hasChanges || updatePlaylist.isPending}
          >
            {updatePlaylist.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
