export const DEFAULT_FONT_FAMILY = "system";

export const FONT_OPTIONS = [
  {
    value: "system",
    label: "System",
    stack:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  {
    value: "roboto",
    label: "Roboto",
    stack: '"Roboto", "Arial", "Helvetica Neue", sans-serif',
  },
  {
    value: "montserrat",
    label: "Montserrat",
    stack: '"Montserrat", "Avenir Next", "Segoe UI", sans-serif',
  },
  {
    value: "serif",
    label: "Classic Serif",
    stack: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    value: "handwritten",
    label: "Handwritten",
    stack: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
  },
  {
    value: "retro",
    label: "Retro Computer",
    stack: '"Courier New", "Lucida Console", Monaco, monospace',
  },
  {
    value: "mono",
    label: "Monospace",
    stack: 'ui-monospace, "SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
  },
] as const;

export type FontFamilyValue = (typeof FONT_OPTIONS)[number]["value"];

export const getFontStack = (fontFamily: string | null | undefined): string =>
  FONT_OPTIONS.find((option) => option.value === fontFamily)?.stack ||
  FONT_OPTIONS[0].stack;

export const isFontFamilyValue = (
  value: string | null | undefined,
): value is FontFamilyValue =>
  FONT_OPTIONS.some((option) => option.value === value);
