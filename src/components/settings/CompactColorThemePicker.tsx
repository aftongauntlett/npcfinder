import React from "react";
import { HexColorPicker } from "react-colorful";
import {
  getContrastColor,
  getComplementaryColor,
} from "../../styles/colorThemes";
import { Button, Input } from "@/components/shared";

interface CompactColorThemePickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  title?: string;
  showPreview?: boolean;
  pickerHeightPx?: number;
  showHexInput?: boolean;
}

const CompactColorThemePicker: React.FC<CompactColorThemePickerProps> = ({
  selectedColor,
  onColorChange,
  title = "Theme Color",
  showPreview = true,
  pickerHeightPx = 160,
  showHexInput = true,
}) => {
  return (
    <div className="space-y-4">
      {title ? (
        <h3 className="text-base font-medium text-primary mb-3">{title}</h3>
      ) : null}

      <div
        className={
          showPreview
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
            : "grid grid-cols-1 gap-4"
        }
      >
        {/* Left: Color Picker + Hex Code Input */}
        <div className="space-y-4">
          <div>
            <HexColorPicker
              color={selectedColor}
              onChange={onColorChange}
              style={{ width: "100%", height: `${pickerHeightPx}px` }}
            />
          </div>

          {showHexInput ? (
            <Input
              label="Hex Code"
              type="text"
              value={selectedColor}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  onColorChange(value);
                }
              }}
              placeholder="#9333ea"
              maxLength={7}
            />
          ) : null}
        </div>

        {/* Right: Preview Examples */}
        {showPreview ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div
                className="w-full h-14 rounded-lg flex items-center justify-center text-base font-heading font-bold transition-colors"
                style={{
                  backgroundColor: selectedColor,
                  color: getContrastColor(selectedColor),
                }}
              >
                Primary: Example Card
              </div>

              <div
                className="w-full h-14 rounded-lg flex items-center justify-center text-base font-heading font-bold transition-colors"
                style={{
                  backgroundColor: getComplementaryColor(selectedColor),
                  color: getContrastColor(getComplementaryColor(selectedColor)),
                }}
              >
                Secondary: Auto-generated
              </div>

              <div className="w-full">
                <h4
                  className="text-xl font-heading font-bold transition-colors"
                  style={{ color: selectedColor }}
                >
                  Primary Header Example
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Links and text accents use primary color
                </p>
                <h4
                  className="text-xl font-heading font-bold transition-colors mt-3"
                  style={{ color: getComplementaryColor(selectedColor) }}
                >
                  Secondary Header Example
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Secondary color is automatically complementary
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  style={{
                    backgroundColor: selectedColor,
                    borderColor: selectedColor,
                    color: getContrastColor(selectedColor),
                  }}
                >
                  Primary
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{
                    backgroundColor: getComplementaryColor(selectedColor),
                    borderColor: getComplementaryColor(selectedColor),
                    color: getContrastColor(
                      getComplementaryColor(selectedColor)
                    ),
                  }}
                >
                  Secondary
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CompactColorThemePicker;
