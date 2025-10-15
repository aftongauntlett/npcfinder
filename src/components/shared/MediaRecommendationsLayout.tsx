import React from "react";
import { User, ThumbsUp, ThumbsDown, Send } from "lucide-react";

// Generic recommendation interface that all media types must conform to
export interface BaseRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  status: string; // Flexible status field - each media type can have specific values
  sent_message: string | null;
  comment: string | null;
  sent_at: string;
  consumed_at?: string | null; // Optional - maps to listened_at/watched_at/read_at/played_at
  poster_url?: string | null;
  // Media-specific fields can be added by extending interfaces
}

export interface FriendSummary {
  user_id: string;
  display_name: string;
  pending_count: number;
  total_count: number;
  hit_count: number;
  miss_count: number;
}

interface QuickStats {
  hits: number;
  misses: number;
  queue: number;
  sent: number;
}

interface MediaRecommendationsLayoutProps<T extends BaseRecommendation> {
  // Content
  mediaType: string; // "Music", "Movies & TV", "Books", "Games"
  mediaIcon: React.ReactNode; // Icon for empty state
  emptyMessage: string; // e.g., "No recommendations yet"
  emptySubMessage: string; // e.g., "When friends send you music, it'll show up here"
  queueLabel: string; // e.g., "Listening Queue", "Watching Queue", "Reading List", "Playing Queue"
  consumedLabel: string; // e.g., "Listened", "Watched", "Read", "Played"

  // Data
  loading: boolean;
  friendsWithRecs: FriendSummary[];
  recommendations: T[];
  quickStats: QuickStats;

  // View state
  selectedView: "overview" | "friend" | "hits" | "misses" | "sent";
  selectedFriendId: string | null;

  // Actions
  onViewChange: (
    view: "overview" | "friend" | "hits" | "misses" | "sent",
    friendId?: string
  ) => void;
  onSendClick: () => void;
  onStatusUpdate: (
    recId: string,
    status: string,
    comment?: string
  ) => void | Promise<void>;

  // Render functions for media-specific content
  renderRecommendationCard: (rec: T, isReceived: boolean) => React.ReactNode;

  // Optional features
  showConsumedBadge?: boolean; // For music: show listen/watch icon badge
}

/**
 * MediaRecommendationsLayout
 *
 * Unified layout component for all media recommendation pages (Music, Movies, Books, Games)
 * Provides consistent visual structure while allowing media-specific customization
 */
export function MediaRecommendationsLayout<T extends BaseRecommendation>({
  mediaType,
  mediaIcon,
  emptyMessage,
  emptySubMessage,
  queueLabel,
  consumedLabel: _consumedLabel, // Reserved for future use
  loading,
  friendsWithRecs,
  recommendations,
  quickStats,
  selectedView,
  selectedFriendId,
  onViewChange,
  onSendClick,
  onStatusUpdate: _onStatusUpdate, // Reserved for future use
  renderRecommendationCard,
  showConsumedBadge: _showConsumedBadge = false, // Reserved for future use
}: MediaRecommendationsLayoutProps<T>) {
  // Overview view with stats and friend cards
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onViewChange("hits")}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {quickStats.hits}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Hits
          </div>
        </button>

        <button
          onClick={() => onViewChange("misses")}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
            {quickStats.misses}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Misses
          </div>
        </button>

        <button
          onClick={() => onViewChange("sent")}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {quickStats.sent}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Sent
          </div>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {quickStats.queue}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {queueLabel}
          </div>
        </div>
      </div>

      {/* From Friends Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            From Friends
            {friendsWithRecs.reduce((sum, f) => sum + f.pending_count, 0) >
              0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({friendsWithRecs.reduce((sum, f) => sum + f.pending_count, 0)}{" "}
                new)
              </span>
            )}
          </h2>
        </div>

        {friendsWithRecs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            {mediaIcon}
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {emptyMessage}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {emptySubMessage}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friendsWithRecs.map((friend) => (
              <button
                key={friend.user_id}
                onClick={() => onViewChange("friend", friend.user_id)}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {friend.display_name}
                    </div>
                    {friend.pending_count > 0 && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {friend.pending_count} new
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{friend.total_count} total</span>
                  {friend.hit_count > 0 && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {friend.hit_count}
                    </span>
                  )}
                  {friend.miss_count > 0 && (
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" />
                      {friend.miss_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Recommendation list view (friend/hits/misses/sent)
  const renderRecommendationList = () => {
    const title =
      selectedView === "friend"
        ? `From ${
            friendsWithRecs.find((f) => f.user_id === selectedFriendId)
              ?.display_name || "Friend"
          }`
        : selectedView === "hits"
        ? "Your Hits"
        : selectedView === "misses"
        ? "Your Misses"
        : "Your Sent";

    const isReceivedView =
      selectedView === "friend" ||
      selectedView === "hits" ||
      selectedView === "misses";

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onViewChange("overview")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to {mediaType}
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {title}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No recommendations here yet
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recommendations.map((rec) => (
              <div key={rec.id}>
                {renderRecommendationCard(rec, isReceivedView)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {mediaType}
          </h1>
          <button
            onClick={onSendClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send {mediaType}
          </button>
        </div>

        {/* Content */}
        {selectedView === "overview"
          ? renderOverview()
          : renderRecommendationList()}
      </div>
    </div>
  );
}
