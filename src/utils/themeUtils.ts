/**
 * Theme Utilities
 *
 * Utility functions for consistent theme color usage throughout the app.
 * These utilities make it easy to apply theme colors without hard-coding values.
 */

import { useTheme } from "@/hooks/useTheme";
import { CSSProperties } from "react";

/**
 * Get inline styles object with theme color CSS variables
 */
export const getThemeColorStyles = (themeColor: string): CSSProperties => {
  return {
    "--color-primary": themeColor,
    "--color-primary-rgb": hexToRgb(themeColor),
  } as CSSProperties;
};

/**
 * Get Tailwind classes using theme color
 * Returns an object with common theme color class combinations
 */
export const getThemeColorClasses = () => {
  return {
    text: "text-primary",
    bg: "bg-primary",
    border: "border-primary",
    hoverBorder: "hover:border-primary",
    hoverText: "hover:text-primary",
    hoverBg: "hover:bg-primary",
    focusRing: "focus:ring-primary focus-visible:ring-primary",
    bgOpacity10: "bg-primary/10",
    bgOpacity20: "bg-primary/20",
    textOpacity80: "text-primary/80",
    borderOpacity20: "border-primary/20",
    borderOpacity50: "border-primary/50",
  };
};

/**
 * Hook that returns theme color styles for inline use
 */
export const useThemeColorStyles = () => {
  const { themeColor } = useTheme();
  return getThemeColorStyles(themeColor);
};

/**
 * Convert hex color to RGB string for use in CSS custom properties
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "147, 51, 234"; // Default purple as fallback

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
    result[3],
    16
  )}`;
}

/**
 * Generate a gradient using theme color
 */
export const getThemeGradient = (
  themeColor: string,
  direction: "to-r" | "to-l" | "to-b" | "to-t" = "to-r"
): string => {
  // Create a lighter and darker variant of the theme color for gradient
  const rgb = hexToRgb(themeColor);
  return `linear-gradient(${
    direction === "to-r"
      ? "to right"
      : direction === "to-l"
      ? "to left"
      : direction === "to-b"
      ? "to bottom"
      : "to top"
  }, rgba(${rgb}, 0.8), rgba(${rgb}, 1))`;
};

/**
 * Get theme color with opacity
 */
export const getThemeColorWithOpacity = (
  themeColor: string,
  opacity: number
): string => {
  const rgb = hexToRgb(themeColor);
  return `rgba(${rgb}, ${opacity})`;
};
