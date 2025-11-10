/**
 * Application constants
 */

// View names
export const VIEWS = {
  HOME: "home",
  MOVIES_TV: "movies-tv",
  SETTINGS: "settings",
  TEST: "test",
} as const;

export type ViewName = (typeof VIEWS)[keyof typeof VIEWS];
