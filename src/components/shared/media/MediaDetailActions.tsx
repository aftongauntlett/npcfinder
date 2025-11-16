import { Check, ArrowLeft, Trash2 } from "lucide-react";
import Button from "../ui/Button";

type MediaType = "movie" | "tv" | "book" | "game" | "music";
type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";
type StatusType = MediaStatus | { label: string; isCompleted: boolean };

interface MediaDetailActionsProps {
  status: StatusType;
  mediaType: MediaType;
  onStatusChange: (status: MediaStatus) => void;
  onRecommend?: () => void;
  onRemove: () => void;
  showRecommendButton?: boolean;
  isInWatchlist?: boolean;
}

/**
 * MediaDetailActions - Action buttons sidebar for media detail modals
 *
 * Handles the action buttons for media status toggle, recommend, and remove.
 * Encapsulates the complex status toggle logic and button rendering.
 */
const MediaDetailActions: React.FC<MediaDetailActionsProps> = ({
  status,
  mediaType,
  onStatusChange,
  onRecommend,
  onRemove,
  showRecommendButton = true,
  isInWatchlist = true,
}) => {
  // Map mediaType to action verb for button labels
  const getActionVerb = (type: MediaType): string => {
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
  };

  const handleStatusToggle = () => {
    // Handle both status types
    if (typeof status === "string") {
      onStatusChange(status === "completed" ? "planned" : "completed");
    } else {
      // For custom status objects, toggle completion
      onStatusChange(status.isCompleted ? "planned" : "completed");
    }
  };

  const isCompleted =
    typeof status === "string" ? status === "completed" : status.isCompleted;

  const getButtonLabel = () => {
    return isCompleted ? "Move Back" : `Mark as ${getActionVerb(mediaType)}`;
  };

  const getButtonVariant = () => {
    return isCompleted ? "secondary" : "primary";
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Button
        onClick={handleStatusToggle}
        variant={getButtonVariant()}
        fullWidth
        className="group"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="group-hover:animate-wiggle inline-block">
            {isCompleted ? (
              <ArrowLeft className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </span>
          {getButtonLabel()}
        </span>
      </Button>

      {showRecommendButton && onRecommend && (
        <Button
          onClick={onRecommend}
          variant="secondary"
          fullWidth
          className="group"
        >
          <span className="flex items-center justify-center gap-2">
            Recommend
          </span>
        </Button>
      )}

      {isInWatchlist && (
        <Button onClick={onRemove} variant="danger" fullWidth className="group">
          <span className="flex items-center justify-center gap-2">
            <span className="group-hover:animate-wiggle inline-block">
              <Trash2 className="w-4 h-4" />
            </span>
            Remove from List
          </span>
        </Button>
      )}
    </div>
  );
};

export default MediaDetailActions;
