/**
 * Color theme utilities for NPC Finder
 * Supports custom hex colors chosen by the user
 */

/**
 * Helper function to determine if text should be white or black based on background color
 * Uses relative luminance calculation for WCAG compliance
 */
export const getContrastColor = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
};

/**
 * Lighten a hex color by a percentage
 */
export const lightenColor = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
  const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
  const newB = Math.min(255, Math.floor(b + (255 - b) * percent));

  return `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};

/**
 * Darken a hex color by a percentage
 */
export const darkenColor = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const newR = Math.floor(r * (1 - percent));
  const newG = Math.floor(g * (1 - percent));
  const newB = Math.floor(b * (1 - percent));

  return `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};

/**
 * Create color variations from a base hex color
 */
export const createColorVariations = (primaryHex: string) => {
  return {
    primary: primaryHex,
    primaryDark: darkenColor(primaryHex, 0.2),
    primaryLight: lightenColor(primaryHex, 0.2),
    primaryPale: lightenColor(primaryHex, 0.8),
    primaryRing: primaryHex,
    textOnPrimary: getContrastColor(primaryHex),
  };
};

/**
 * Default theme color (purple)
 */
export const DEFAULT_THEME_COLOR = "#9333ea";
