import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Trash2,
  Undo2,
  Edit3,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import ActionButton from "./ActionButton";
import Button from "./Button";

interface BaseRecommendation {
  id: string;
  title: string;
  status:
    | "pending"
    | "listened"
    | "watched"
    | "read"
    | "played"
    | "hit"
    | "miss";
  sent_message: string | null;
  comment: string | null;
  sender_comment: string | null; // Sender's own note on what they sent
  opened_at?: string | null;
  from_user_id: string;
  to_user_id: string;
}

interface MediaRecommendationCardProps<T extends BaseRecommendation> {
  rec: T;
  index: number;
  isReceived: boolean;
  senderName?: string; // Display name - sender for received recs, recipient for sent recs
  onStatusUpdate: (
    recId: string,
    status: string,
    comment?: string
  ) => Promise<void>;
  onDelete: (recId: string) => Promise<void>;
  onUpdateSenderComment?: (
    recId: string,
    senderComment: string
  ) => Promise<void>; // For updating sender's own comment
  renderMediaInfo: (rec: T) => React.ReactNode;
  renderMediaArt: (rec: T) => React.ReactNode;
  reviewSummary?: { rating?: number; is_public?: boolean } | null; // Optional review indicator
}

/**
 * Universal MediaRecommendationCard
 * Works for Music, Movies, TV, Books, and Games
 * Handles hit/miss buttons, comments, and unsend functionality
 */
function MediaRecommendationCard<T extends BaseRecommendation>({
  rec,
  index,
  isReceived,
  senderName,
  onStatusUpdate,
  onDelete,
  onUpdateSenderComment,
  renderMediaInfo,
  renderMediaArt,
  reviewSummary,
}: MediaRecommendationCardProps<T>) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isAddingSenderComment, setIsAddingSenderComment] = useState(false);
  const [commentText, setCommentText] = useState(rec.comment || "");
  const [senderCommentText, setSenderCommentText] = useState(
    rec.sender_comment || ""
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveComment = async () => {
    await onStatusUpdate(rec.id, rec.status, commentText);
    setIsAddingComment(false);
  };

  const handleSaveSenderComment = async () => {
    if (onUpdateSenderComment) {
      await onUpdateSenderComment(rec.id, senderCommentText);
      setIsAddingSenderComment(false);
    }
  };

  const handleUnsend = () => {
    setShowDeleteModal(true);
  };

  const confirmUnsend = async () => {
    if (isDeleting) return; // Prevent duplicate calls

    try {
      setIsDeleting(true);
      await onDelete(rec.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting:", error);
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      {/* Main Row: Index, Art, Info, Actions */}
      <div className="flex items-center gap-3">
        {/* Index Number */}
        <div className="w-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          {index + 1}
        </div>

        {/* Media Art (album cover, poster, book cover, game art) */}
        {renderMediaArt(rec)}

        {/* Media Info (title, artist/director/author, year, badges, etc.) */}
        <div className="flex-1 min-w-0">
          {renderMediaInfo(rec)}

          {/* Recipient Name - Only when sent */}
          {!isReceived && senderName && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sent to: <span className="font-medium">{senderName}</span>
            </div>
          )}

          {/* Review Indicator Badge - Only when received and has public review */}
          {isReceived && reviewSummary?.is_public && (
            <div className="mt-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium"
                title="You've shared a public review for this"
              >
                ⭐
                {reviewSummary.rating
                  ? ` ${reviewSummary.rating}/5 Reviewed`
                  : " Reviewed"}
              </span>
            </div>
          )}

          {/* Sent Message */}
          {rec.sent_message && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
              "{rec.sent_message}"
            </div>
          )}

          {/* Recipient's Comment Display (only when received and not editing) */}
          {isReceived && rec.comment && !isAddingComment && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Your note: {rec.comment}
            </div>
          )}

          {/* Sender's Comment Display */}
          {!isReceived && rec.sender_comment && !isAddingSenderComment && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Your note: {rec.sender_comment}
            </div>
          )}
          {isReceived && rec.sender_comment && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {senderName}'s note: {rec.sender_comment}
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          {isReceived ? (
            <>
              {/* Hit/Miss/Comment buttons for received */}
              <div className="flex items-center gap-2">
                <ActionButton
                  icon={ThumbsUp}
                  onClick={() => void onStatusUpdate(rec.id, "hit")}
                  variant="success"
                  isActive={rec.status === "hit"}
                  title={
                    rec.status === "hit"
                      ? "Hit!"
                      : `Mark as Hit (private feedback to ${
                          senderName || "sender"
                        })`
                  }
                />
                <ActionButton
                  icon={ThumbsDown}
                  onClick={() => void onStatusUpdate(rec.id, "miss")}
                  variant="danger"
                  isActive={rec.status === "miss"}
                  title={
                    rec.status === "miss"
                      ? "Miss"
                      : `Mark as Miss (private feedback to ${
                          senderName || "sender"
                        })`
                  }
                />
                {/* Comment button - adds recipient's note */}
                {!isAddingComment && (
                  <ActionButton
                    icon={rec.comment ? Edit3 : MessageSquare}
                    onClick={() => {
                      setCommentText(rec.comment || "");
                      setIsAddingComment(true);
                    }}
                    variant="comment"
                    isActive={!!rec.comment}
                    title={
                      rec.comment
                        ? "Edit your note"
                        : `Add private note for ${senderName || "sender"}`
                    }
                  />
                )}
                {/* Delete button */}
                <ActionButton
                  icon={Trash2}
                  onClick={handleUnsend}
                  variant="danger"
                  title="Delete"
                />
              </div>
            </>
          ) : (
            // Sent view - show status and delete/unsend option
            <div className="flex items-center gap-2">
              {/* Status indicator - only show for rated items */}
              {rec.status !== "pending" && (
                <div className="text-sm">
                  {rec.status === "hit" && (
                    <span
                      className="p-2 rounded-lg text-white flex items-center"
                      style={{ backgroundColor: "rgb(70 200 117)" }}
                      title="Hit"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </span>
                  )}
                  {rec.status === "miss" && (
                    <span
                      className="p-2 rounded-lg text-white flex items-center"
                      style={{ backgroundColor: "rgb(218 113 113)" }}
                      title="Miss"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </span>
                  )}
                  {(rec.status === "listened" ||
                    rec.status === "watched" ||
                    rec.status === "read" ||
                    rec.status === "played") && (
                    <span
                      className="capitalize"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {rec.status}
                    </span>
                  )}
                </div>
              )}

              {/* Comment button - adds sender's note */}
              {!isAddingSenderComment && onUpdateSenderComment && (
                <ActionButton
                  icon={rec.sender_comment ? Edit3 : MessageSquare}
                  onClick={() => {
                    setSenderCommentText(rec.sender_comment || "");
                    setIsAddingSenderComment(true);
                  }}
                  variant="comment"
                  isActive={!!rec.sender_comment}
                  title={
                    rec.sender_comment ? "Edit your note" : "Add your note"
                  }
                />
              )}

              {/* Action button - Undo for unsent, Delete for opened/rated */}
              {rec.status === "pending" && !rec.opened_at ? (
                // Unsend (undo) - not yet opened
                <ActionButton
                  icon={Undo2}
                  onClick={handleUnsend}
                  variant="default"
                  disabled={isDeleting}
                  title="Unsend (recipient hasn't seen it yet)"
                />
              ) : (
                // Delete - opened or rated
                <ActionButton
                  icon={Trash2}
                  onClick={handleUnsend}
                  variant="danger"
                  disabled={isDeleting}
                  title={
                    rec.opened_at ? "Delete (recipient has seen it)" : "Delete"
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-width Recipient Comment Input */}
      {isReceived && isAddingComment && (
        <div className="mt-3 pl-20">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your thoughts..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveComment();
                if (e.key === "Escape") setIsAddingComment(false);
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setIsAddingComment(false)}
                variant="subtle"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveComment()}
                variant="primary"
                size="sm"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full-width Sender Comment Input */}
      {!isReceived && isAddingSenderComment && (
        <div className="mt-3 pl-20">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={senderCommentText}
              onChange={(e) => setSenderCommentText(e.target.value)}
              placeholder="Add your note about this recommendation..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveSenderComment();
                if (e.key === "Escape") setIsAddingSenderComment(false);
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setIsAddingSenderComment(false)}
                variant="subtle"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveSenderComment()}
                variant="primary"
                size="sm"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => void confirmUnsend()}
        title={
          isReceived
            ? "Delete from Your List?"
            : rec.opened_at || rec.status !== "pending"
            ? "Delete from Your Sent List?"
            : "Unsend Recommendation?"
        }
        message={
          isReceived
            ? "This will remove the recommendation from your view only. The sender will still see it in their sent list."
            : rec.opened_at || rec.status !== "pending"
            ? "This will remove it from your sent list only. The recipient will still see it in their received list."
            : "The recipient hasn't opened this yet. Unsending will remove it completely for both you and the recipient."
        }
        confirmText={
          isReceived
            ? "Delete from My List"
            : rec.opened_at || rec.status !== "pending"
            ? "Delete from Sent"
            : "Unsend"
        }
        variant="danger"
      />
    </motion.div>
  );
}

export default React.memo(MediaRecommendationCard);
