import React from "react";
import { HexColorPicker } from "react-colorful";
import { Palette } from "lucide-react";
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
  showGuidanceText?: boolean;
  // Secondary color support
  secondaryColor?: string | null;
  onSecondaryColorChange?: (color: string | null) => void;
}

const CompactColorThemePicker: React.FC<CompactColorThemePickerProps> = ({
  selectedColor,
  onColorChange,
  title = "Theme Color",
  showPreview = true,
  pickerHeightPx = 160,
  showHexInput = true,
  showGuidanceText = true,
  secondaryColor,
  onSecondaryColorChange,
}) => {
  const showSecondary = !!onSecondaryColorChange;

  return (
    <div className="space-y-4">
      {title ? (
        <div className="space-y-2">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          {showGuidanceText && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Choose your primary theme color. This will be used for links,
              buttons, and accents throughout the app. A complementary secondary
              color will be automatically generated to create visual harmony.
              (You can customize this below)
            </p>
          )}
        </div>
      ) : null}

      {!showPreview ? (
        /* Compact mode: pickers side by side when secondary is visible */
        <>
          <div className={showSecondary ? "grid grid-cols-2 gap-4" : ""}>
            {/* Primary */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-primary">
                Primary Color
              </h4>
              <HexColorPicker
                color={selectedColor}
                onChange={onColorChange}
                style={{ width: "100%", height: `${pickerHeightPx}px` }}
              />
              {showHexInput ? (
                <div className="space-y-1">
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
                  <p className="text-xs text-gray-500">
                    A hex code is a 6-digit code starting with # that represents
                    a color (e.g., #FF0000 for red)
                  </p>
                </div>
              ) : null}
            </div>

            {/* Secondary (side by side) */}
            {showSecondary && onSecondaryColorChange ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-secondary">
                  Secondary Color
                </h4>
                <HexColorPicker
                  color={secondaryColor || getComplementaryColor(selectedColor)}
                  onChange={onSecondaryColorChange}
                  style={{ width: "100%", height: `${pickerHeightPx}px` }}
                />
                {showHexInput ? (
                  <div className="space-y-1">
                    <Input
                      label="Hex Code"
                      type="text"
                      value={
                        secondaryColor || getComplementaryColor(selectedColor)
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          onSecondaryColorChange(value);
                        }
                      }}
                      placeholder="#9333ea"
                      maxLength={7}
                    />
                    <p className="text-xs text-gray-500">
                      A hex code is a 6-digit code starting with # that
                      represents a color (e.g., #FF0000 for red)
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* no checkbox - secondary is always shown */}
        </>
      ) : (
        /* Preview mode: original side-by-side picker + preview layout */
        <>
          {/* Primary Color Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-primary">Primary Color</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="space-y-1">
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
                    <p className="text-xs text-gray-500">
                      A hex code is a 6-digit code starting with # that
                      represents a color (e.g., #FF0000 for red)
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Right: Preview Examples */}
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

                  <div className="w-full space-y-2">
                    <h4
                      className="text-xl font-heading font-bold transition-colors"
                      style={{ color: selectedColor }}
                    >
                      Primary Header Example
                    </h4>
                    <p className="text-sm text-gray-500">
                      Links and text accents use primary color
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Palette className="w-3 h-3" />}
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
                      icon={<Palette className="w-3 h-3" />}
                      style={{
                        borderColor: selectedColor,
                        color: selectedColor,
                      }}
                    >
                      Primary
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-select toggle removed - secondary always shown */}
          </div>

          {/* Secondary Color Section — always shown */}
          {onSecondaryColorChange ? (
            <div className="space-y-4 border-t border-gray-200/80 dark:border-gray-700/30 pt-6">
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Customize Secondary Color
                </h3>
                {showGuidanceText && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Choose a color that complements your primary. Good secondary
                    colors provide contrast while maintaining visual harmony -
                    consider analogous colors (next to each other on the color
                    wheel) or triadic colors for balanced palettes.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Secondary Color Picker + Hex Code Input */}
                <div className="space-y-4">
                  <div>
                    <HexColorPicker
                      color={
                        secondaryColor || getComplementaryColor(selectedColor)
                      }
                      onChange={onSecondaryColorChange}
                      style={{ width: "100%", height: `${pickerHeightPx}px` }}
                    />
                  </div>

                  {showHexInput ? (
                    <div className="space-y-1">
                      <Input
                        label="Hex Code"
                        type="text"
                        value={
                          secondaryColor || getComplementaryColor(selectedColor)
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            onSecondaryColorChange(value);
                          }
                        }}
                        placeholder="#9333ea"
                        maxLength={7}
                      />
                      <p className="text-xs text-gray-500">
                        A hex code is a 6-digit code starting with # that
                        represents a color (e.g., #FF0000 for red)
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Right: Secondary Preview */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div
                      className="w-full h-14 rounded-lg flex items-center justify-center text-base font-heading font-bold transition-colors"
                      style={{
                        backgroundColor:
                          secondaryColor ||
                          getComplementaryColor(selectedColor),
                        color: getContrastColor(
                          secondaryColor ||
                            getComplementaryColor(selectedColor),
                        ),
                      }}
                    >
                      Secondary: Custom Card
                    </div>

                    <div className="w-full space-y-2">
                      <h4
                        className="text-xl font-heading font-bold transition-colors"
                        style={{
                          color:
                            secondaryColor ||
                            getComplementaryColor(selectedColor),
                        }}
                      >
                        Secondary Header Example
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Secondary elements and backgrounds
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Palette className="w-3 h-3" />}
                        style={{
                          backgroundColor:
                            secondaryColor ||
                            getComplementaryColor(selectedColor),
                          borderColor:
                            secondaryColor ||
                            getComplementaryColor(selectedColor),
                          color: getContrastColor(
                            secondaryColor ||
                              getComplementaryColor(selectedColor),
                          ),
                        }}
                      >
                        Secondary
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Palette className="w-3 h-3" />}
                        style={{
                          borderColor:
                            secondaryColor ||
                            getComplementaryColor(selectedColor),
                          color:
                            secondaryColor ||
                            getComplementaryColor(selectedColor),
                        }}
                      >
                        Secondary
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default CompactColorThemePicker;
