import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Send,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface BaseRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  status: string;
  sent_message: string | null;
  comment: string | null;
  sent_at: string;
  consumed_at?: string | null;
  poster_url?: string | null;
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

interface InlineRecommendationsLayoutProps<T extends BaseRecommendation> {
  mediaType: string;
  mediaIcon: LucideIcon;
  emptyMessage: string;
  emptySubMessage: string;
  loading: boolean;
  friendsWithRecs: FriendSummary[];
  quickStats: QuickStats;
  hits: T[];
  misses: T[];
  sent: T[];
  friendRecommendations: Map<string, T[]>; // friendId -> recommendations
  renderRecommendationCard: (
    rec: T,
    isReceived: boolean,
    index?: number
  ) => React.ReactNode;
}

type SectionType = "hits" | "misses" | "sent" | null;

/**
 * InlineRecommendationsLayout
 * Shows all recommendation data on one page with expandable sections
 * No navigation - everything is inline
 */
export function InlineRecommendationsLayout<T extends BaseRecommendation>({
  quickStats,
  friendsWithRecs,
  renderRecommendationCard,
  hits,
  misses,
  sent,
  friendRecommendations,
}: InlineRecommendationsLayoutProps<T>) {
  const [expandedSection, setExpandedSection] = useState<SectionType>(null);
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null);

  const toggleSection = (section: SectionType) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleFriend = (friendId: string) => {
    setExpandedFriend(expandedFriend === friendId ? null : friendId);
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats - Always visible */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => toggleSection("hits")}
          className={`bg-white dark:bg-gray-800 rounded-lg p-6 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
            expandedSection === "hits"
              ? ""
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          aria-label="View your hits"
          aria-expanded={expandedSection === "hits"}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {quickStats.hits}
            </div>
            {expandedSection === "hits" ? (
              <ChevronDown className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Hits
          </div>
        </button>

        <button
          onClick={() => toggleSection("misses")}
          className={`bg-white dark:bg-gray-800 rounded-lg p-6 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
            expandedSection === "misses"
              ? ""
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          aria-label="View your misses"
          aria-expanded={expandedSection === "misses"}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {quickStats.misses}
            </div>
            {expandedSection === "misses" ? (
              <ChevronDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Misses
          </div>
        </button>

        <button
          onClick={() => toggleSection("sent")}
          className={`bg-white dark:bg-gray-800 rounded-lg p-6 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
            expandedSection === "sent"
              ? ""
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          aria-label="View recommendations you sent"
          aria-expanded={expandedSection === "sent"}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {quickStats.sent}
            </div>
            {expandedSection === "sent" ? (
              <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Sent
          </div>
        </button>
      </div>

      {/* Expanded Hits Section */}
      {expandedSection === "hits" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Hits
            </h2>
          </div>
          {hits.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No hits yet!
            </p>
          ) : (
            <div className="space-y-1">
              {hits.map((rec, index) =>
                renderRecommendationCard(rec, true, index)
              )}
            </div>
          )}
        </div>
      )}

      {/* Expanded Misses Section */}
      {expandedSection === "misses" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Misses
            </h2>
          </div>
          {misses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No misses yet!
            </p>
          ) : (
            <div className="space-y-1">
              {misses.map((rec, index) =>
                renderRecommendationCard(rec, true, index)
              )}
            </div>
          )}
        </div>
      )}

      {/* Expanded Sent Section */}
      {expandedSection === "sent" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Sent
            </h2>
          </div>
          {sent.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              You haven't sent any recommendations yet
            </p>
          ) : (
            <div className="space-y-1">
              {sent.map((rec, index) =>
                renderRecommendationCard(rec, false, index)
              )}
            </div>
          )}
        </div>
      )}

      {/* From Friends Section - Always visible */}
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
            <p className="text-gray-500 dark:text-gray-400">
              No recommendations from friends yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {friendsWithRecs.map((friend) => (
              <div
                key={friend.user_id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFriend(friend.user_id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  aria-expanded={expandedFriend === friend.user_id}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {friend.display_name}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{friend.total_count} total</span>
                        {friend.pending_count > 0 && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {friend.pending_count} new
                          </span>
                        )}
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
                    </div>
                  </div>
                  {expandedFriend === friend.user_id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedFriend === friend.user_id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                    {(() => {
                      const friendRecs =
                        friendRecommendations.get(friend.user_id) || [];
                      return friendRecs.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No recommendations from this friend
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {friendRecs.map((rec, index) =>
                            renderRecommendationCard(rec, true, index)
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
