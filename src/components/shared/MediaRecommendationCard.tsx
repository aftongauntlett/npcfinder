import React, { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Trash2,
  Copy,
  Undo2,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import IconButton from "./IconButton";

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
  senderName?: string; // Display name of the person who sent the recommendation
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
  getCopyText?: (rec: T) => string; // Optional function to customize copy text
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
  getCopyText,
}: MediaRecommendationCardProps<T>) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isAddingSenderComment, setIsAddingSenderComment] = useState(false);
  const [commentText, setCommentText] = useState(rec.comment || "");
  const [senderCommentText, setSenderCommentText] = useState(
    rec.sender_comment || ""
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);

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

  const handleCopyTitle = async () => {
    try {
      const textToCopy = getCopyText ? getCopyText(rec) : rec.title;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
              {/* Copy Title Button - Only on received items */}
              <IconButton
                icon={Copy}
                onClick={() => void handleCopyTitle()}
                variant={copiedTitle ? "success" : "default"}
                title={copiedTitle ? "Copied!" : "Copy title"}
              />

              {/* Hit/Miss/Comment buttons for received */}
              <div className="flex items-center gap-2">
                <IconButton
                  icon={ThumbsUp}
                  onClick={() => void onStatusUpdate(rec.id, "hit")}
                  variant={rec.status === "hit" ? "active" : "success"}
                  title={rec.status === "hit" ? "Hit!" : "Mark as hit"}
                />
                <IconButton
                  icon={ThumbsDown}
                  onClick={() => void onStatusUpdate(rec.id, "miss")}
                  variant={rec.status === "miss" ? "active" : "warning"}
                  title={rec.status === "miss" ? "Miss" : "Mark as miss"}
                  className={rec.status === "miss" ? "!bg-orange-600" : ""}
                />
                {/* Comment button - adds recipient's note */}
                {!isAddingComment && (
                  <IconButton
                    icon={MessageSquare}
                    onClick={() => {
                      setCommentText(rec.comment || "");
                      setIsAddingComment(true);
                    }}
                    variant={rec.comment ? "active" : "primary"}
                    title={rec.comment ? "Edit your note" : "Add your note"}
                  />
                )}
                {/* Delete button */}
                <IconButton
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
                      style={{ backgroundColor: "var(--color-primary)" }}
                      title="Hit"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </span>
                  )}
                  {rec.status === "miss" && (
                    <span
                      className="p-2 rounded-lg bg-orange-600 text-white flex items-center"
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
                <IconButton
                  icon={MessageSquare}
                  onClick={() => {
                    setSenderCommentText(rec.sender_comment || "");
                    setIsAddingSenderComment(true);
                  }}
                  variant={rec.sender_comment ? "active" : "primary"}
                  title={
                    rec.sender_comment ? "Edit your note" : "Add your note"
                  }
                />
              )}

              {/* Action button - Undo for unsent, Delete for opened/rated */}
              {rec.status === "pending" && !rec.opened_at ? (
                // Unsend (undo) - not yet opened
                <IconButton
                  icon={Undo2}
                  onClick={handleUnsend}
                  variant="warning"
                  disabled={isDeleting}
                  title="Unsend (recipient hasn't seen it yet)"
                  className="hover:!bg-yellow-600"
                />
              ) : (
                // Delete - opened or rated
                <IconButton
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
              <button
                onClick={() => setIsAddingComment(false)}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSaveComment()}
                className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Save
              </button>
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
              <button
                onClick={() => setIsAddingSenderComment(false)}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSaveSenderComment()}
                className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Save
              </button>
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
    </div>
  );
}

export default React.memo(MediaRecommendationCard);
