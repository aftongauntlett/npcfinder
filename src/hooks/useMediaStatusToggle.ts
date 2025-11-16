import { useCallback } from "react";

type MediaType = "movie" | "tv" | "book" | "game" | "music";
type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";
type StatusType = MediaStatus | { label: string; isCompleted: boolean };

interface UseMediaStatusToggleReturn {
  handleStatusToggle: () => void;
  getButtonLabel: () => string;
  getButtonVariant: () => "primary" | "secondary";
  isCompleted: boolean;
}

/**
 * useMediaStatusToggle - Custom hook for media status toggle logic
 *
 * Handles the status toggle logic for media items, including button labels
 * and variants based on media type and current status.
 */
export function useMediaStatusToggle(
  status: StatusType,
  mediaType: MediaType,
  onStatusChange: (status: MediaStatus) => void
): UseMediaStatusToggleReturn {
  // Map mediaType to action verb for button labels
  const getActionVerb = useCallback((type: MediaType): string => {
    switch (type) {
      case "movie":
      case "tv":
        return "Watched";
      case "book":
        return "Read";
      case "game":
        return "Played";
      case "music":
        return "Listened";
      default:
        return "Watched";
    }
  }, []);

  const isCompleted =
    typeof status === "string" ? status === "completed" : status.isCompleted;

  const handleStatusToggle = useCallback(() => {
    // Handle both status types
    if (typeof status === "string") {
      onStatusChange(status === "completed" ? "planned" : "completed");
    } else {
      // For custom status objects, toggle completion
      onStatusChange(status.isCompleted ? "planned" : "completed");
    }
  }, [status, onStatusChange]);

  const getButtonLabel = useCallback(() => {
    return isCompleted ? "Move Back" : `Mark as ${getActionVerb(mediaType)}`;
  }, [isCompleted, mediaType, getActionVerb]);

  const getButtonVariant = useCallback((): "primary" | "secondary" => {
    return isCompleted ? "secondary" : "primary";
  }, [isCompleted]);

  return {
    handleStatusToggle,
    getButtonLabel,
    getButtonVariant,
    isCompleted,
  };
}
