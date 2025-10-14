import React from "react";
import { Check } from "lucide-react";
import { colorThemes, type ThemeColorName } from "../../styles/colorThemes";

interface ColorThemePickerProps {
  selectedColor: ThemeColorName;
  onColorChange: (color: ThemeColorName) => void;
}

const ColorThemePicker: React.FC<ColorThemePickerProps> = ({
  selectedColor,
  onColorChange,
}) => {
  const themes = Object.values(colorThemes);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Theme Color
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred accent color throughout the app
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {themes.map((theme) => {
          const isSelected = theme.name === selectedColor;

          return (
            <button
              key={theme.name}
              type="button"
              onClick={() => onColorChange(theme.name)}
              className={`relative group flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={theme.label}
              aria-label={`Select ${theme.label} theme`}
            >
              {/* Color circle */}
              <div
                className={`w-12 h-12 rounded-full transition-transform ${
                  isSelected ? "scale-110" : "group-hover:scale-105"
                }`}
                style={{ backgroundColor: theme.primary }}
              >
                {/* Checkmark for selected */}
                {isSelected && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Check
                      className="w-6 h-6"
                      style={{ color: theme.textOnPrimary }}
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium ${
                  isSelected
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {theme.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: colorThemes[selectedColor].primary,
              color: colorThemes[selectedColor].textOnPrimary,
            }}
          >
            Aa
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Preview
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              This color will be used for buttons, links, and accents
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorThemePicker;
