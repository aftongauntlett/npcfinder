/**
 * Color theme definitions for NPC Finder
 * Each theme includes light and dark mode variants with proper contrast
 */

export type ThemeColorName =
  | "purple"
  | "blue"
  | "teal"
  | "green"
  | "orange"
  | "pink"
  | "red"
  | "indigo";

export interface ColorTheme {
  name: ThemeColorName;
  label: string;
  primary: string; // Main color (500)
  primaryDark: string; // Darker variant (700)
  primaryLight: string; // Lighter variant (400)
  primaryPale: string; // Very light (100)
  primaryRing: string; // For focus rings (600)
  textOnPrimary: string; // Text color when background is primary (white/black)
}

export const colorThemes: Record<ThemeColorName, ColorTheme> = {
  purple: {
    name: "purple",
    label: "Purple",
    primary: "#9333ea", // purple-600
    primaryDark: "#7e22ce", // purple-700
    primaryLight: "#a855f7", // purple-500
    primaryPale: "#f3e8ff", // purple-100
    primaryRing: "#9333ea", // purple-600
    textOnPrimary: "#ffffff", // White text on purple
  },
  blue: {
    name: "blue",
    label: "Blue",
    primary: "#2563eb", // blue-600
    primaryDark: "#1d4ed8", // blue-700
    primaryLight: "#3b82f6", // blue-500
    primaryPale: "#dbeafe", // blue-100
    primaryRing: "#2563eb", // blue-600
    textOnPrimary: "#ffffff", // White text on blue
  },
  teal: {
    name: "teal",
    label: "Teal",
    primary: "#0d9488", // teal-600
    primaryDark: "#0f766e", // teal-700
    primaryLight: "#14b8a6", // teal-500
    primaryPale: "#ccfbf1", // teal-100
    primaryRing: "#0d9488", // teal-600
    textOnPrimary: "#ffffff", // White text on teal
  },
  green: {
    name: "green",
    label: "Green",
    primary: "#16a34a", // green-600
    primaryDark: "#15803d", // green-700
    primaryLight: "#22c55e", // green-500
    primaryPale: "#dcfce7", // green-100
    primaryRing: "#16a34a", // green-600
    textOnPrimary: "#ffffff", // White text on green
  },
  orange: {
    name: "orange",
    label: "Orange",
    primary: "#ea580c", // orange-600
    primaryDark: "#c2410c", // orange-700
    primaryLight: "#f97316", // orange-500
    primaryPale: "#ffedd5", // orange-100
    primaryRing: "#ea580c", // orange-600
    textOnPrimary: "#ffffff", // White text on orange
  },
  pink: {
    name: "pink",
    label: "Pink",
    primary: "#db2777", // pink-600
    primaryDark: "#be185d", // pink-700
    primaryLight: "#ec4899", // pink-500
    primaryPale: "#fce7f3", // pink-100
    primaryRing: "#db2777", // pink-600
    textOnPrimary: "#ffffff", // White text on pink
  },
  red: {
    name: "red",
    label: "Red",
    primary: "#dc2626", // red-600
    primaryDark: "#b91c1c", // red-700
    primaryLight: "#ef4444", // red-500
    primaryPale: "#fee2e2", // red-100
    primaryRing: "#dc2626", // red-600
    textOnPrimary: "#ffffff", // White text on red
  },
  indigo: {
    name: "indigo",
    label: "Indigo",
    primary: "#4f46e5", // indigo-600
    primaryDark: "#4338ca", // indigo-700
    primaryLight: "#6366f1", // indigo-500
    primaryPale: "#e0e7ff", // indigo-100
    primaryRing: "#4f46e5", // indigo-600
    textOnPrimary: "#ffffff", // White text on indigo
  },
};

/**
 * Get theme object by name
 */
export const getTheme = (name: ThemeColorName): ColorTheme => {
  return colorThemes[name] || colorThemes.purple;
};

/**
 * Get all available theme names
 */
export const getThemeNames = (): ThemeColorName[] => {
  return Object.keys(colorThemes) as ThemeColorName[];
};
