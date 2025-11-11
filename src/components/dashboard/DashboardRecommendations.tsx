import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  User,
  Clapperboard,
  TvIcon,
} from "lucide-react";
import {
  useMovieRecommendations,
  useFriendsWithMovieRecs,
  useUpdateMovieRecommendationStatus,
  useDeleteMovieRecommendation,
  useUpdateRecipientNote,
} from "../../hooks/useMovieQueries";
import MediaRecommendationCard from "../shared/MediaRecommendationCard";
import type { Recommendation } from "../../services/recommendationsService.types";

interface FriendWithRecs {
  user_id: string;
  display_name: string;
  recommendations: Recommendation[];
}

// Map service Recommendation to card's expected format
interface CardRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
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
  comment: string | null; // Maps to recipient_note
  sender_comment: string | null; // Maps to sender_note
  sent_at: string;
  opened_at?: string | null;
  // Extended properties for render functions
  media_type: "song" | "album" | "movie" | "tv";
  poster_url?: string;
  year?: number;
  overview?: string;
}

function mapToCardRec(rec: Recommendation): CardRecommendation {
  return {
    id: rec.id,
    from_user_id: rec.from_user_id,
    to_user_id: rec.to_user_id,
    external_id: rec.external_id,
    title: rec.title,
    status: rec.status as CardRecommendation["status"],
    sent_message: rec.sent_message || null,
    comment: rec.recipient_note || null,
    sender_comment: rec.sender_note || null,
    sent_at: rec.created_at, // Map created_at to sent_at
    opened_at: rec.opened_at,
    media_type: rec.media_type,
    poster_url: rec.poster_url,
    year: rec.year,
    overview: rec.overview,
  };
}

/**
 * DashboardRecommendations
 * Shows pending recommendations from friends on the dashboard
 * Reusable for movies, music, books, games (accepts mediaType)
 */
export function DashboardRecommendations() {
  const [expandedFriends, setExpandedFriends] = useState<Set<string>>(
    new Set()
  );
  const updateStatusMutation = useUpdateMovieRecommendationStatus();
  const deleteRecMutation = useDeleteMovieRecommendation();
  const updateRecipientNoteMutation = useUpdateRecipientNote();

  // Fetch pending movie recommendations using the existing hook
  const { data: recommendations = [], isLoading } =
    useMovieRecommendations("queue");

  // Fetch friends data to get display names
  const { data: friendsWithRecs = [] } = useFriendsWithMovieRecs();

  // Create a map of user_id -> display_name from friends data
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    friendsWithRecs.forEach((friend) => {
      map.set(friend.user_id, friend.display_name);
    });
    return map;
  }, [friendsWithRecs]);

  // Group recommendations by sender
  const friendsGrouped: FriendWithRecs[] = useMemo(() => {
    const recsByFriend = new Map<string, Recommendation[]>();

    recommendations.forEach((rec) => {
      const friendId = rec.from_user_id;
      if (!recsByFriend.has(friendId)) {
        recsByFriend.set(friendId, []);
      }
      // Type assertion: this component only handles movie/TV recommendations
      recsByFriend.get(friendId)!.push(rec as Recommendation);
    });

    const grouped: FriendWithRecs[] = [];
    recsByFriend.forEach((recs, friendId) => {
      grouped.push({
        user_id: friendId,
        display_name: userNameMap.get(friendId) || "Unknown User",
        recommendations: recs,
      });
    });

    // Sort by number of recommendations (most first)
    return grouped.sort(
      (a, b) => b.recommendations.length - a.recommendations.length
    );
  }, [recommendations, userNameMap]);

  const toggleFriend = (friendId: string) => {
    setExpandedFriends((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  const updateRecommendationStatus = async (
    recId: string,
    status: string,
    comment?: string
  ) => {
    try {
      const dbStatus = status === "consumed" ? "watched" : status;
      await updateStatusMutation.mutateAsync({
        recId,
        status: dbStatus,
      });

      // If comment is provided, update recipient's note
      if (comment !== undefined) {
        await updateRecipientNoteMutation.mutateAsync({
          recId,
          note: comment,
        });
      }
    } catch (error) {
      console.error("Error updating recommendation:", error);
    }
  };

  const deleteRecommendation = async (recId: string) => {
    try {
      await deleteRecMutation.mutateAsync(recId);
    } catch (error) {
      console.error("Error deleting recommendation:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Loading recommendations...
        </p>
      </div>
    );
  }

  if (friendsGrouped.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No pending recommendations
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          When friends recommend movies or shows, they'll appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friendsGrouped.map((friend) => (
        <div
          key={friend.user_id}
          className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm"
        >
          <button
            type="button"
            onClick={() => toggleFriend(friend.user_id)}
            className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            aria-expanded={expandedFriends.has(friend.user_id)}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {friend.display_name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {friend.recommendations.length}{" "}
                  {friend.recommendations.length === 1
                    ? "recommendation"
                    : "recommendations"}
                </div>
              </div>
            </div>
            {expandedFriends.has(friend.user_id) ? (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {expandedFriends.has(friend.user_id) && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="space-y-1">
                {friend.recommendations.map((rec, index) => {
                  const cardRec = mapToCardRec(rec);
                  const MediaIcon =
                    cardRec.media_type === "tv" ? TvIcon : Clapperboard;
                  const senderName =
                    userNameMap.get(rec.from_user_id) || "Unknown User";
                  const isNew = !rec.opened_at; // Show "NEW" badge if never opened

                  return (
                    <div key={rec.id} className="relative">
                      {/* NEW indicator badge */}
                      {isNew && (
                        <div className="absolute -top-1 -left-1 z-10">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500 text-white shadow-sm">
                            NEW
                          </span>
                        </div>
                      )}
                      <MediaRecommendationCard
                        rec={cardRec}
                        index={index}
                        isReceived={true}
                        senderName={senderName}
                        onStatusUpdate={updateRecommendationStatus}
                        onDelete={deleteRecommendation}
                        renderMediaArt={(r) => {
                          const typed = r;
                          return typed.poster_url ? (
                            <img
                              src={typed.poster_url}
                              alt={typed.title}
                              className="w-12 h-16 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <MediaIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          );
                        }}
                        renderMediaInfo={(r) => {
                          const typed = r;
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {typed.title}
                                </h3>
                                {typed.media_type === "tv" ? (
                                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                                    <TvIcon className="w-3 h-3" />
                                    TV
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                                    <Clapperboard className="w-3 h-3" />
                                    Movie
                                  </span>
                                )}
                              </div>
                              {typed.year && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {typed.year}
                                </p>
                              )}
                              {typed.overview && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                  {typed.overview}
                                </p>
                              )}
                            </>
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
