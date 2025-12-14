import React, { useMemo, useState } from "react";
import { Button, Input, Modal, Textarea, PrivacyToggle } from "@/components/shared";

interface EditMediaListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: {
    title: string;
    description?: string | null;
    is_public: boolean;
  };
  onSave: (updates: {
    title: string;
    description?: string | null;
    is_public: boolean;
  }) => Promise<void>;
}

const EditMediaListModal: React.FC<EditMediaListModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSave,
}) => {
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [isPublic, setIsPublic] = useState(initialValues.is_public);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && !isSubmitting,
    [title, isSubmitting]
  );

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        is_public: isPublic,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit List" maxWidth="lg">
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
          <Button onClick={handleSave} disabled={!canSubmit} loading={isSubmitting}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditMediaListModal;
