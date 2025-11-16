import {
  ThumbsUp,
  ThumbsDown,
  ChatCircle,
  Trash,
  ArrowCounterClockwise,
  PencilSimple,
} from "@phosphor-icons/react";
import ActionButtonGroup from "../common/ActionButtonGroup";
import type { BaseRecommendation } from "../types";
import MediaRecommendationStatus from "./MediaRecommendationStatus";

interface MediaRecommendationActionsProps<T extends BaseRecommendation> {
  isReceived: boolean;
  rec: T;
  senderName?: string;
  onStatusUpdate: (
    recId: string,
    status: string,
    comment?: string
  ) => Promise<void>;
  onDelete: (recId: string) => void;
  onUpdateSenderComment?: (
    recId: string,
    senderComment: string
  ) => Promise<void>;
  isDeleting: boolean;
  onCommentClick: () => void;
  onSenderCommentClick: () => void;
  isAddingComment: boolean;
  isAddingSenderComment: boolean;
}

/**
 * MediaRecommendationActions - Action buttons for recommendation cards
 *
 * Handles the action button groups for both received and sent views.
 * Received: Hit/Miss/Comment/Delete buttons
 * Sent: Status indicator, Comment, Unsend/Delete buttons
 */
function MediaRecommendationActions<T extends BaseRecommendation>({
  isReceived,
  rec,
  senderName,
  onStatusUpdate,
  onDelete,
  onUpdateSenderComment,
  isDeleting,
  onCommentClick,
  onSenderCommentClick,
  isAddingComment,
  isAddingSenderComment,
}: MediaRecommendationActionsProps<T>) {
  if (isReceived) {
    return (
      <ActionButtonGroup
        actions={[
          {
            id: "hit",
            icon: <ThumbsUp size={18} weight="duotone" />,
            label:
              rec.status === "hit"
                ? "Hit!"
                : `Mark as Hit (private feedback to ${senderName || "sender"})`,
            onClick: () => void onStatusUpdate(rec.id, "hit"),
            variant: rec.status === "hit" ? "success" : "default",
            tooltip:
              rec.status === "hit"
                ? "Hit!"
                : `Mark as Hit (private feedback to ${senderName || "sender"})`,
          },
          {
            id: "miss",
            icon: <ThumbsDown size={18} weight="duotone" />,
            label:
              rec.status === "miss"
                ? "Miss"
                : `Mark as Miss (private feedback to ${
                    senderName || "sender"
                  })`,
            onClick: () => void onStatusUpdate(rec.id, "miss"),
            variant: rec.status === "miss" ? "danger" : "default",
            tooltip:
              rec.status === "miss"
                ? "Miss"
                : `Mark as Miss (private feedback to ${
                    senderName || "sender"
                  })`,
          },
          ...(!isAddingComment
            ? [
                {
                  id: "comment",
                  icon: rec.comment ? (
                    <PencilSimple size={18} weight="duotone" />
                  ) : (
                    <ChatCircle size={18} weight="duotone" />
                  ),
                  label: rec.comment
                    ? "Edit your note"
                    : `Add private note for ${senderName || "sender"}`,
                  onClick: onCommentClick,
                  variant: (rec.comment ? "success" : "default") as
                    | "success"
                    | "default",
                  tooltip: rec.comment
                    ? "Edit your note"
                    : `Add private note for ${senderName || "sender"}`,
                },
              ]
            : []),
          {
            id: "delete",
            icon: <Trash size={18} weight="duotone" />,
            label: "Delete",
            onClick: () => onDelete(rec.id),
            variant: "danger" as const,
            tooltip: "Delete",
          },
        ]}
        orientation="horizontal"
        size="md"
        spacing="tight"
      />
    );
  }

  // Sent view - show status and delete/unsend option
  return (
    <div className="flex items-center gap-2">
      {/* Status indicator - only show for rated items */}
      <MediaRecommendationStatus status={rec.status} openedAt={rec.opened_at} />

      <ActionButtonGroup
        actions={[
          ...(!isAddingSenderComment && onUpdateSenderComment
            ? [
                {
                  id: "sender-comment",
                  icon: rec.sender_comment ? (
                    <PencilSimple size={18} weight="duotone" />
                  ) : (
                    <ChatCircle size={18} weight="duotone" />
                  ),
                  label: rec.sender_comment
                    ? "Edit your note"
                    : "Add your note",
                  onClick: onSenderCommentClick,
                  variant: (rec.sender_comment ? "success" : "default") as
                    | "success"
                    | "default",
                  tooltip: rec.sender_comment
                    ? "Edit your note"
                    : "Add your note",
                },
              ]
            : []),
          {
            id: "unsend-delete",
            icon:
              rec.status === "pending" && !rec.opened_at ? (
                <ArrowCounterClockwise size={18} weight="duotone" />
              ) : (
                <Trash size={18} weight="duotone" />
              ),
            label:
              rec.status === "pending" && !rec.opened_at
                ? "Unsend (recipient hasn't seen it yet)"
                : rec.opened_at
                ? "Delete (recipient has seen it)"
                : "Delete",
            onClick: () => onDelete(rec.id),
            variant: (rec.status === "pending" && !rec.opened_at
              ? "warning"
              : "danger") as "warning" | "danger",
            disabled: isDeleting,
            tooltip:
              rec.status === "pending" && !rec.opened_at
                ? "Unsend (recipient hasn't seen it yet)"
                : rec.opened_at
                ? "Delete (recipient has seen it)"
                : "Delete",
          },
        ]}
        orientation="horizontal"
        size="md"
        spacing="tight"
      />
    </div>
  );
}

export default MediaRecommendationActions;
