/**
 * Real Recommendations Service - Supabase Implementation
 * Queries movie_recommendations and music_recommendations tables
 */

import { supabase } from "../lib/supabase";
import type {
  RecommendationFilters,
  FriendStats,
  QuickStats,
  Recommendation,
} from "./recommendationsService.types";

// Map of media types to table names
const TABLE_MAP = {
  movie: "movie_recommendations",
  tv: "movie_recommendations",
  song: "music_recommendations",
  album: "music_recommendations",
} as const;

/**
 * Get recommendations with filters
 */
export async function getRecommendations(
  currentUserId: string,
  filters: RecommendationFilters
): Promise<Recommendation[]> {
  const { direction, mediaType, status, fromUserId } = filters;

  // Determine which table to query
  const tableName =
    mediaType && mediaType in TABLE_MAP
      ? TABLE_MAP[mediaType]
      : "movie_recommendations"; // default to movies

  let query = supabase.from(tableName).select("*");

  // Filter by direction
  if (direction === "received") {
    query = query.eq("to_user_id", currentUserId);
  } else if (direction === "sent") {
    query = query.eq("from_user_id", currentUserId);
  }

  // Filter by status
  if (status) {
    query = query.eq("status", status);
  }

  // Filter by specific friend
  if (fromUserId) {
    query = query.eq("from_user_id", fromUserId);
  }

  // Filter by specific media type
  if (mediaType) {
    query = query.eq("media_type", mediaType);
  }

  // Order by created date, newest first
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }

  return data || [];
}

/**
 * Get recommendations received from a specific friend
 */
export async function getRecommendationsFromFriend(
  currentUserId: string,
  friendId: string,
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<Recommendation[]> {
  return getRecommendations(currentUserId, {
    direction: "received",
    mediaType,
    fromUserId: friendId,
  });
}

/**
 * Get all friends who have sent recommendations, with stats
 */
export async function getFriendsWithRecommendations(
  currentUserId: string,
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<FriendStats[]> {
  const recs = await getRecommendations(currentUserId, {
    direction: "received",
    mediaType,
  });

  // Group by sender
  const friendMap = new Map<string, FriendStats>();

  for (const rec of recs) {
    const friendId = rec.from_user_id;

    if (!friendMap.has(friendId)) {
      // Fetch friend's profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", friendId)
        .single();

      friendMap.set(friendId, {
        user_id: friendId,
        display_name: profile?.display_name || "Unknown User",
        pending_count: 0,
        total_count: 0,
        hit_count: 0,
        miss_count: 0,
      });
    }

    const stats = friendMap.get(friendId)!;
    stats.total_count++;

    if (rec.status === "pending") stats.pending_count++;
    if (rec.status === "hit") stats.hit_count++;
    if (rec.status === "miss") stats.miss_count++;
  }

  return Array.from(friendMap.values());
}

/**
 * Get quick stats for dashboard
 */
export async function getQuickStats(
  currentUserId: string,
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<QuickStats> {
  const received = await getRecommendations(currentUserId, {
    direction: "received",
    mediaType,
  });

  const sent = await getRecommendations(currentUserId, {
    direction: "sent",
    mediaType,
  });

  return {
    hits: received.filter((r) => r.status === "hit").length,
    misses: received.filter((r) => r.status === "miss").length,
    queue: received.filter((r) => r.status === "pending").length,
    sent: sent.length,
  };
}

/**
 * Update recommendation status
 */
export async function updateRecommendationStatus(
  recId: string,
  status: "pending" | "consumed" | "watched" | "hit" | "miss",
  tableName: "movie_recommendations" | "music_recommendations"
): Promise<void> {
  const { error } = await supabase
    .from(tableName)
    .update({
      status,
      watched_at: status !== "pending" ? new Date().toISOString() : null,
    })
    .eq("id", recId);

  if (error) {
    console.error("Error updating recommendation status:", error);
    throw error;
  }
}

/**
 * Delete a recommendation
 */
export async function deleteRecommendation(
  recId: string,
  tableName: "movie_recommendations" | "music_recommendations"
): Promise<void> {
  const { error } = await supabase.from(tableName).delete().eq("id", recId);

  if (error) {
    console.error("Error deleting recommendation:", error);
    throw error;
  }
}

/**
 * Update sender's note on a recommendation
 */
export async function updateSenderNote(
  recId: string,
  note: string,
  tableName: "movie_recommendations" | "music_recommendations"
): Promise<void> {
  const { error } = await supabase
    .from(tableName)
    .update({ sender_note: note })
    .eq("id", recId);

  if (error) {
    console.error("Error updating sender note:", error);
    throw error;
  }
}

/**
 * Update recipient's note on a recommendation
 */
export async function updateRecipientNote(
  recId: string,
  note: string,
  tableName: "movie_recommendations" | "music_recommendations"
): Promise<void> {
  const { error } = await supabase
    .from(tableName)
    .update({ recipient_note: note })
    .eq("id", recId);

  if (error) {
    console.error("Error updating recipient note:", error);
    throw error;
  }
}
