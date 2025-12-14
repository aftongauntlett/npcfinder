import Input from "@/components/shared/ui/Input";
import IconPicker from "@/components/shared/common/IconPicker";
import CompactColorThemePicker from "@/components/settings/CompactColorThemePicker";
import type { IconOption } from "@/utils/taskIcons";

interface TaskAppearanceControlsProps {
  icon: string | null;
  setIcon: (value: string | null) => void;

  iconColor: string;
  setIconColor: (value: string) => void;

  icons: IconOption[];

  iconHexInputId: string;
  iconPickerLabel?: string;
}

export default function TaskAppearanceControls({
  icon,
  setIcon,
  iconColor,
  setIconColor,
  icons,
  iconHexInputId,
  iconPickerLabel = "Icon",
}: TaskAppearanceControlsProps) {
  return (
    <>
      {/* Left: icon picker */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-primary">
          {iconPickerLabel}
        </label>
        <IconPicker selectedIcon={icon} onIconChange={setIcon} icons={icons} />
      </div>

      {/* Right: color */}
      <div className="space-y-3">
        <Input
          id={iconHexInputId}
          label="Hex Code"
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
        <CompactColorThemePicker
          selectedColor={iconColor}
          onColorChange={setIconColor}
          title=""
          showPreview={false}
          pickerHeightPx={140}
          showHexInput={false}
        />
      </div>
    </>
  );
}
