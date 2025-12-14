import {
  ThumbsUpIcon as ThumbsUp,
  ThumbsDownIcon as ThumbsDown,
} from "@phosphor-icons/react";

interface MediaRecommendationStatusProps {
  status: string;
  openedAt?: string | null;
}

/**
 * MediaRecommendationStatus - Status indicator for sent recommendations
 *
 * Displays visual indicators for hit/miss/watched/listened/read/played status.
 * Only renders when status is not "pending".
 */
function MediaRecommendationStatus({ status }: MediaRecommendationStatusProps) {
  if (status === "pending") {
    return null;
  }

  return (
    <div className="text-sm">
      {status === "hit" && (
        <span
          className="p-2 rounded-lg text-white flex items-center"
          style={{ backgroundColor: "rgb(70 200 117)" }}
          title="Hit"
        >
          <ThumbsUp size={16} weight="duotone" />
        </span>
      )}
      {status === "miss" && (
        <span
          className="p-2 rounded-lg text-white flex items-center"
          style={{ backgroundColor: "rgb(218 113 113)" }}
          title="Miss"
        >
          <ThumbsDown size={16} weight="duotone" />
        </span>
      )}
      {(status === "listened" ||
        status === "watched" ||
        status === "read" ||
        status === "played") && (
        <span className="capitalize" style={{ color: "var(--color-primary)" }}>
          {status}
        </span>
      )}
    </div>
  );
}

export default MediaRecommendationStatus;
