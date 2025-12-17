import Input from "@/components/shared/ui/Input";
import IconSelect from "@/components/shared/common/IconSelect";
import CompactColorThemePicker from "@/components/settings/CompactColorThemePicker";
import type { IconOption } from "@/utils/taskIcons";

interface TaskAppearanceControlsProps {
  id?: string;
  icon: string | null;
  setIcon: (value: string | null) => void;

  iconColor: string;
  setIconColor: (value: string) => void;

  icons: IconOption[];

  iconHexInputId: string;
  iconPickerLabel?: string;
}

export default function TaskAppearanceControls({
  id = "task-icon",
  icon,
  setIcon,
  iconColor,
  setIconColor,
  icons,
  iconHexInputId,
  iconPickerLabel = "Icon",
}: TaskAppearanceControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 items-start">
      {/* Icon Dropdown */}
      <IconSelect
        id={id}
        label={iconPickerLabel}
        selectedIcon={icon}
        onIconChange={setIcon}
        icons={icons}
        iconColor={iconColor}
      />

      {/* Hex Input + Color Picker */}
      <div className="space-y-3">
        <Input
          id={iconHexInputId}
          label="Color"
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
        <div className="relative">
          <CompactColorThemePicker
            selectedColor={iconColor}
            onColorChange={setIconColor}
            title=""
            showPreview={false}
            pickerHeightPx={140}
            showHexInput={false}
          />
        </div>
      </div>
    </div>
  );
}
