import React, { useMemo, useState } from "react";
import { Button, Input, Modal, Textarea, PrivacyToggle } from "@/components/shared";

interface CreateMediaListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    title: string;
    description?: string | null;
    is_public: boolean;
  }) => Promise<void>;
}

const CreateMediaListModal: React.FC<CreateMediaListModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => title.trim().length > 0 && !isSubmitting, [
    title,
    isSubmitting,
  ]);

  const handleClose = () => {
    if (isSubmitting) return;
    setTitle("");
    setDescription("");
    setIsPublic(false);
    onClose();
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        is_public: isPublic,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create List" maxWidth="lg">
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "Movies by Tim Burton"'
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short note about what this list is for"
            rows={3}
          />
        </div>

        <PrivacyToggle
          variant="switch"
          size="sm"
          isPublic={isPublic}
          onChange={setIsPublic}
          showDescription
          contextLabel="list"
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateMediaListModal;
