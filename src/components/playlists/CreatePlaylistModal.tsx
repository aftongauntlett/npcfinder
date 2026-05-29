import { useState } from "react";
import { Button, Input, Modal, Textarea } from "@/components/shared";
import { useCreatePlaylist } from "@/hooks/usePlaylistsQueries";
import PlaylistIconPicker from "./PlaylistIconPicker";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (playlistSlug: string) => void;
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onCreated,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("list-music");
  const createPlaylist = useCreatePlaylist();

  const handleClose = () => {
    setName("");
    setDescription("");
    setIcon("list-music");
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const created = await createPlaylist.mutateAsync({
      name: trimmedName,
      description: description.trim() || null,
      is_private: true,
      icon,
    });

    setName("");
    setDescription("");
    setIcon("list-music");
    onClose();

    if (created?.slug) onCreated?.(created.slug);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Playlist"
      maxWidth="xl"
    >
      <div className="p-6 space-y-4">
        <Input
          id="new-playlist-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Things That Feel Like Rain"
          required
          autoFocus
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Icon
          </label>
          <PlaylistIconPicker
            value={icon}
            onChange={setIcon}
            disabled={createPlaylist.isPending}
          />
        </div>

        <Textarea
          id="new-playlist-description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional description"
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!name.trim() || createPlaylist.isPending}
          >
            {createPlaylist.isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
