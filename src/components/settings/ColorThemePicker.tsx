import React from "react";
import { Palette, Save } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { getContrastColor } from "../../styles/colorThemes";

interface ColorThemePickerProps {
  selectedColor: string; // Hex color
  onColorChange: (color: string) => void;
}

const ColorThemePicker: React.FC<ColorThemePickerProps> = ({
  selectedColor,
  onColorChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white dark:text-white mb-2 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Theme Color
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-400">
          Choose any color you like for your personalized theme
        </p>
      </div>

      {/* Color Picker */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Color Picker Widget */}
        <div className="flex-shrink-0">
          <HexColorPicker
            color={selectedColor}
            onChange={onColorChange}
            style={{ width: "200px", height: "200px" }}
          />
        </div>

        {/* Color Info and Preview */}
        <div className="flex-1 space-y-4 w-full">
          {/* Hex Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hex Color Code
            </label>
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => {
                const value = e.target.value;
                // Only update if it's a valid hex color or being typed
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  onColorChange(value);
                }
              }}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="#000000"
              maxLength={7}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a 6-digit hex code (e.g., #9333ea)
            </p>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preview
            </label>
            <div
              className="w-full h-20 rounded-lg flex items-center justify-center text-xl font-heading font-bold transition-colors"
              style={{
                backgroundColor: selectedColor,
                color: getContrastColor(selectedColor),
              }}
            >
              Example
            </div>
          </div>

          {/* Example Elements */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              How it looks
            </label>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Primary Button Example - with preview styles */}
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded border-2 transition-colors"
                style={{
                  backgroundColor: selectedColor,
                  borderColor: selectedColor,
                  color: getContrastColor(selectedColor),
                }}
              >
                <Save className="w-4 h-4" />
                Primary Button
              </button>

              {/* Secondary Button Example - with preview styles */}
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded border-2 bg-transparent transition-colors"
                style={{
                  borderColor: selectedColor,
                  color: selectedColor,
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-gray-900/30 rounded-lg border border-gray-700/30">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold">Tip:</span> This color will be used
          throughout the app for buttons, links, highlights, and other accent
          elements. Choose a color that you love!
        </p>
      </div>
    </div>
  );
};

export default ColorThemePicker;
