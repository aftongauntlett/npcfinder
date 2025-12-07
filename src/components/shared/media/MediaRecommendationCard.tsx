import React, { useState, useCallback } from "react";
import ConfirmationModal from "../ui/ConfirmationModal";
import MediaRecommendationCommentInput from "./MediaRecommendationCommentInput";
import MediaRecommendationActions from "./MediaRecommendationActions";
import type { BaseRecommendation } from "../types";
import { logger } from "@/lib/logger";

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
 * MediaRecommendationCard - Universal recommendation card component for all media types
 *
 * This is the primary component for displaying media recommendations across the application.
 * It uses a render props pattern to allow media-specific customization while maintaining
 * consistent recommendation interactions and UI.
 *
 * Supported Media Types:
 * - Movies & TV Shows
 * - Music (albums, tracks)
 * - Books
 * - Games
 *
 * Features:
 * - Hit/Miss buttons for received recommendations
 * - Comment system (receiver comments, sender notes)
 * - Delete/Unsend functionality
 * - Status tracking (pending, hit, miss, queued)
 * - Automatic UI adaptation based on isReceived (received vs sent)
 * - Review indicator integration
 * - Animated entrance with stagger effect
 *
 * Render Props Pattern:
 * @param {function} renderMediaArt - Should return a 12x16 aspect ratio image or icon representing the media.
 *                                    Example: <MediaPoster src={rec.poster_url} size="sm" />
 *
 * @param {function} renderMediaInfo - Should return title, badges, year, and description in a consistent format.
 *                                     Example: <div><h3>{rec.title}</h3><p>{rec.year}</p></div>
 *
 * @param {boolean} isReceived - Determines UI mode: true = show hit/miss buttons, false = show unsend button
 *
 * Usage Examples:
 * See implementation in:
 * - src/components/pages/movies/MoviesSuggestions.tsx
 * - src/components/pages/books/BooksSuggestions.tsx
 * - src/components/pages/games/GamesSuggestions.tsx
 * - src/components/pages/music/MusicSuggestions.tsx
 *
 * @example
 * <MediaRecommendationCard
 *   rec={recommendation}
 *   isReceived={true}
 *   renderMediaArt={(rec) => <MediaPoster src={rec.poster_url} />}
 *   renderMediaInfo={(rec) => <div><h3>{rec.title}</h3></div>}
 *   onStatusUpdate={handleStatusUpdate}
 *   onDelete={handleDelete}
 * />
 *
 * Memoized: Rendered in lists of 50+ recommendations, prevents rerenders when rec unchanged
 */
function MediaRecommendationCardComponent<T extends BaseRecommendation>({
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

  const handleSaveComment = useCallback(async () => {
    await onStatusUpdate(rec.id, rec.status, commentText);
    setIsAddingComment(false);
  }, [onStatusUpdate, rec.id, rec.status, commentText]);

  const handleSaveSenderComment = useCallback(async () => {
    if (onUpdateSenderComment) {
      await onUpdateSenderComment(rec.id, senderCommentText);
      setIsAddingSenderComment(false);
    }
  }, [onUpdateSenderComment, rec.id, senderCommentText]);

  const handleUnsend = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const confirmUnsend = useCallback(async () => {
    if (isDeleting) return; // Prevent duplicate calls

    try {
      setIsDeleting(true);
      await onDelete(rec.id);
      setShowDeleteModal(false);
    } catch (error) {
      logger.error("Failed to delete recommendation", { error, recId: rec.id });
      setIsDeleting(false);
    }
  }, [isDeleting, onDelete, rec.id]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200">
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
          <MediaRecommendationActions
            isReceived={isReceived}
            rec={rec}
            senderName={senderName}
            onStatusUpdate={onStatusUpdate}
            onDelete={handleUnsend}
            onUpdateSenderComment={onUpdateSenderComment}
            isDeleting={isDeleting}
            onCommentClick={() => {
              setCommentText(rec.comment || "");
              setIsAddingComment(true);
            }}
            onSenderCommentClick={() => {
              setSenderCommentText(rec.sender_comment || "");
              setIsAddingSenderComment(true);
            }}
            isAddingComment={isAddingComment}
            isAddingSenderComment={isAddingSenderComment}
          />
        </div>
      </div>

      {/* Full-width Recipient Comment Input */}
      {isReceived && isAddingComment && (
        <MediaRecommendationCommentInput
          value={commentText}
          onChange={setCommentText}
          onSave={handleSaveComment}
          onCancel={() => setIsAddingComment(false)}
          placeholder="Add your thoughts..."
        />
      )}

      {/* Full-width Sender Comment Input */}
      {!isReceived && isAddingSenderComment && (
        <MediaRecommendationCommentInput
          value={senderCommentText}
          onChange={setSenderCommentText}
          onSave={handleSaveSenderComment}
          onCancel={() => setIsAddingSenderComment(false)}
          placeholder="Add your note about this recommendation..."
        />
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

// Memoize with custom comparison to prevent rerenders when rec unchanged
const MemoizedMediaRecommendationCard = React.memo(
  MediaRecommendationCardComponent,
  (prevProps, nextProps) =>
    prevProps.rec.id === nextProps.rec.id &&
    prevProps.rec.status === nextProps.rec.status &&
    prevProps.rec.comment === nextProps.rec.comment &&
    prevProps.rec.sender_comment === nextProps.rec.sender_comment
) as <T extends BaseRecommendation>(
  props: MediaRecommendationCardProps<T>
) => React.JSX.Element;

export default MemoizedMediaRecommendationCard;
