import React from "react";
import { HexColorPicker } from "react-colorful";
import { getContrastColor } from "../../styles/colorThemes";
import { Button, Input } from "@/components/shared";

interface CompactColorThemePickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const CompactColorThemePicker: React.FC<CompactColorThemePickerProps> = ({
  selectedColor,
  onColorChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-primary mb-3">Theme Color</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Color Picker + Hex Code Input */}
        <div className="space-y-4">
          <div>
            <HexColorPicker
              color={selectedColor}
              onChange={onColorChange}
              style={{ width: "100%", height: "160px" }}
            />
          </div>

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
            inputClassName="font-mono"
          />
        </div>

        {/* Right: Preview Examples */}
        <div className="space-y-4">
          {/* Example Card - Top aligned with input field */}
          <div className="space-y-3">
            <div
              className="w-full h-14 rounded-lg flex items-center justify-center text-base font-heading font-bold transition-colors"
              style={{
                backgroundColor: selectedColor,
                color: getContrastColor(selectedColor),
              }}
            >
              Example Card
            </div>

            {/* Header Text Example */}
            <div className="w-full">
              <h4
                className="text-xl font-heading font-bold transition-colors"
                style={{ color: selectedColor }}
              >
                Header Example
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Links and text accents use this color
              </p>
            </div>

            {/* Button Preview */}
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
                  borderColor: selectedColor,
                  color: selectedColor,
                }}
              >
                Secondary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactColorThemePicker;
