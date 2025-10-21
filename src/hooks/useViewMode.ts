import { useState, useEffect } from "react";

type ViewMode = "grid" | "list";

const VIEW_MODE_STORAGE_KEY = "npc-finder-view-mode";

/**
 * Custom hook to persist view mode preference across the entire app
 * Stores the user's preference in localStorage
 */
export function useViewMode(
  defaultMode: ViewMode = "grid"
): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Initialize from localStorage if available
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored === "grid" || stored === "list") {
        return stored;
      }
    } catch (error) {
      console.warn("Failed to read view mode from localStorage:", error);
    }
    return defaultMode;
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Failed to save view mode to localStorage:", error);
    }
  };

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === VIEW_MODE_STORAGE_KEY &&
        (e.newValue === "grid" || e.newValue === "list")
      ) {
        setViewModeState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return [viewMode, setViewMode];
}
