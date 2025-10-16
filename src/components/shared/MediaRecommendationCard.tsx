import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

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
}

interface MediaRecommendationCardProps<T extends BaseRecommendation> {
  rec: T;
  index: number;
  isReceived: boolean;
  onStatusUpdate: (
    recId: string,
    status: string,
    comment?: string
  ) => Promise<void>;
  onDelete: (recId: string) => Promise<void>;
  renderMediaInfo: (rec: T) => React.ReactNode;
  renderMediaArt: (rec: T) => React.ReactNode;
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
  onStatusUpdate,
  onDelete,
  renderMediaInfo,
  renderMediaArt,
}: MediaRecommendationCardProps<T>) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentText, setCommentText] = useState(rec.comment || "");

  const handleSaveComment = async () => {
    await onStatusUpdate(rec.id, rec.status, commentText);
    setIsAddingComment(false);
  };

  const handleUnsend = async () => {
    if (confirm("Are you sure you want to unsend this recommendation?")) {
      await onDelete(rec.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center gap-4">
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

          {/* Comment Display */}
          {rec.comment && !isAddingComment && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Your note: {rec.comment}
            </div>
          )}

          {/* Comment Input */}
          {isAddingComment && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your thoughts..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveComment();
                  if (e.key === "Escape") setIsAddingComment(false);
                }}
                autoFocus
              />
              <button
                onClick={() => void handleSaveComment()}
                className="px-2 py-1 text-sm text-white rounded hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Save
              </button>
              <button
                onClick={() => setIsAddingComment(false)}
                className="px-2 py-1 text-sm bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col items-end gap-2">
          {isReceived ? (
            <>
              {/* Hit/Miss buttons - always show for received */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void onStatusUpdate(rec.id, "hit")}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    rec.status === "hit"
                      ? "text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-white"
                  }`}
                  style={
                    rec.status === "hit"
                      ? { backgroundColor: "var(--color-primary)" }
                      : undefined
                  }
                  onMouseEnter={(e) => {
                    if (rec.status !== "hit") {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (rec.status !== "hit") {
                      e.currentTarget.style.backgroundColor = "";
                    }
                  }}
                  title={rec.status === "hit" ? "Hit!" : "Mark as hit"}
                >
                  {rec.status === "hit" ? (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      Hit
                    </span>
                  ) : (
                    "Hit"
                  )}
                </button>
                <button
                  onClick={() => void onStatusUpdate(rec.id, "miss")}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    rec.status === "miss"
                      ? "bg-gray-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-600 hover:text-white"
                  }`}
                  title={rec.status === "miss" ? "Miss" : "Mark as miss"}
                >
                  {rec.status === "miss" ? (
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4" />
                      Miss
                    </span>
                  ) : (
                    "Miss"
                  )}
                </button>
              </div>
              {/* Comment button */}
              {!isAddingComment && (
                <button
                  onClick={() => setIsAddingComment(true)}
                  className="text-xs hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  {rec.comment ? "Edit note" : "Add note"}
                </button>
              )}
            </>
          ) : (
            // Sent view - show status and unsend option
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm">
                {rec.status === "hit" && (
                  <span
                    className="flex items-center gap-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Hit
                  </span>
                )}
                {rec.status === "miss" && (
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <ThumbsDown className="w-4 h-4" />
                    Miss
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
                {rec.status === "pending" && (
                  <span className="text-gray-500 dark:text-gray-400">
                    Pending
                  </span>
                )}
              </div>
              {/* Unsend button - only show if not yet consumed/rated */}
              {rec.status === "pending" && (
                <button
                  onClick={() => void handleUnsend()}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Unsend
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaRecommendationCard;
