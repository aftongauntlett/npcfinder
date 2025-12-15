import React, { useMemo, useState } from "react";
import { Button, Input, Modal, Textarea, PrivacyToggle } from "@/components/shared";
import IconSelect from "@/components/shared/common/IconSelect";
import CompactColorThemePicker from "@/components/settings/CompactColorThemePicker";
import { getIconsForMediaType } from "@/utils/mediaIcons";
import type { MediaDomain } from "@/services/mediaListsService.types";
import { useTheme } from "@/hooks/useTheme";

interface CreateMediaListModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: MediaDomain;
  onCreate: (params: {
    title: string;
    description?: string | null;
    icon?: string | null;
    icon_color?: string | null;
    is_public: boolean;
  }) => Promise<void>;
}

const CreateMediaListModal: React.FC<CreateMediaListModalProps> = ({
  isOpen,
  onClose,
  domain,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const { themeColor } = useTheme();
  const [iconColor, setIconColor] = useState<string>(themeColor);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const iconOptions = useMemo(() => getIconsForMediaType(domain), [domain]);

  const canSubmit = useMemo(() => title.trim().length > 0 && !isSubmitting, [
    title,
    isSubmitting,
  ]);

  const handleClose = () => {
    if (isSubmitting) return;
    setTitle("");
    setDescription("");
    setIcon(null);
    setIconColor(themeColor);
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
        icon,
        icon_color: iconColor,
        is_public: isPublic,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create List" maxWidth="lg">
      <div className="p-6 space-y-6">
        {/* Core Details */}
        <div className="space-y-4">
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

        {/* Appearance */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-4 space-y-3">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Appearance
            </span>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            <IconSelect
              id="media-list-icon"
              label="Icon"
              selectedIcon={icon}
              onIconChange={setIcon}
              icons={iconOptions}
              iconColor={iconColor}
              disabled={isSubmitting}
            />
            <div className="w-28">
              <Input
                label="Hex"
                type="text"
                value={iconColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setIconColor(value);
                  }
                }}
                placeholder="#9333ea"
                maxLength={7}
              />
            </div>
            <div className="flex items-end h-full">
              <CompactColorThemePicker
                selectedColor={iconColor}
                onColorChange={setIconColor}
                title=""
                showPreview={false}
                pickerHeightPx={120}
                showHexInput={false}
              />
            </div>
          </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <PrivacyToggle
            variant="switch"
            size="sm"
            isPublic={isPublic}
            onChange={setIsPublic}
            showDescription
            contextLabel="list"
            align="right"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
