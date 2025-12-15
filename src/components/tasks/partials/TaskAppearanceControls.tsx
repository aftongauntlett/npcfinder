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
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
      {/* Column 1: Icon Dropdown */}
      <IconSelect
        id={id}
        label={iconPickerLabel}
        selectedIcon={icon}
        onIconChange={setIcon}
        icons={icons}
        iconColor={iconColor}
      />

      {/* Column 2: Hex Input */}
      <div className="w-28">
        <Input
          id={iconHexInputId}
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

      {/* Column 3: Color Picker */}
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
  );
}
