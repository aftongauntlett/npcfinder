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
  WatchlistItem,
  AddWatchlistItemData,
} from "./recommendationsService.types";

// Map of media types to table names (use views that include user names)
const TABLE_MAP = {
  movie: "movie_recommendations_with_users",
  tv: "movie_recommendations_with_users",
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

  // Determine which table/view to query (use view for movies/tv to get user names)
  const tableName =
    mediaType && mediaType in TABLE_MAP
      ? TABLE_MAP[mediaType]
      : "movie_recommendations_with_users"; // default to movies view

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
  tableName:
    | "movie_recommendations"
    | "music_recommendations"
    | "book_recommendations"
): Promise<void> {
  // Books use 'read' status, not 'consumed' or 'watched'
  const finalStatus =
    tableName === "book_recommendations" && status === "consumed"
      ? "read"
      : status;

  // Books use 'read_at', not 'watched_at'
  const timestampField =
    tableName === "book_recommendations" ? "read_at" : "watched_at";

  const { error } = await supabase
    .from(tableName)
    .update({
      status: finalStatus,
      [timestampField]:
        finalStatus !== "pending" ? new Date().toISOString() : null,
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
  tableName:
    | "movie_recommendations"
    | "music_recommendations"
    | "book_recommendations"
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
  tableName:
    | "movie_recommendations"
    | "music_recommendations"
    | "book_recommendations"
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
  tableName:
    | "movie_recommendations"
    | "music_recommendations"
    | "book_recommendations"
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

/**
 * Get user's watchlist
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_watchlist")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) {
    console.error("Error fetching watchlist:", error);
    throw error;
  }

  return data || [];
}

/**
 * Add item to watchlist
 */
export async function addToWatchlist(
  itemData: AddWatchlistItemData
): Promise<WatchlistItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_watchlist")
    .insert({
      user_id: user.id,
      ...itemData,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding to watchlist:", error);
    throw error;
  }

  return data;
}

/**
 * Toggle watched status
 */
export async function toggleWatchlistWatched(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // First get the current item
  const { data: item, error: fetchError } = await supabase
    .from("user_watchlist")
    .select("watched")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching watchlist item:", fetchError);
    throw fetchError;
  }

  // Toggle the watched status
  const { error } = await supabase
    .from("user_watchlist")
    .update({
      watched: !item.watched,
      watched_at: !item.watched ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error toggling watched status:", error);
    throw error;
  }
}

/**
 * Delete item from watchlist
 */
export async function deleteFromWatchlist(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_watchlist")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting from watchlist:", error);
    throw error;
  }
}

/**
 * Update watchlist item
 */
export async function updateWatchlistItem(
  id: string,
  updates: Partial<AddWatchlistItemData>
): Promise<WatchlistItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_watchlist")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating watchlist item:", error);
    throw error;
  }

  return data;
}

/**
 * BOOK RECOMMENDATIONS - Separate functions since books don't have media_type
 */

// Book recommendation interface
interface BookRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  authors: string | null;
  thumbnail_url: string | null;
  published_date: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  recommendation_type: string;
  status: string;
  sent_message: string | null;
  sender_note: string | null;
  recipient_note: string | null;
  created_at: string;
  read_at: string | null;
  opened_at: string | null;
  sender_name?: string;
  recipient_name?: string;
}

/**
 * Get book recommendations with filters
 */
export async function getBookRecommendations(
  currentUserId: string,
  filters: Omit<RecommendationFilters, "mediaType">
): Promise<BookRecommendation[]> {
  const { direction, status, fromUserId } = filters;

  let query = supabase.from("book_recommendations_with_users").select("*");

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

  // Order by created date, newest first
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching book recommendations:", error);
    return [];
  }

  return data || [];
}

/**
 * Get book recommendations received from a specific friend
 */
export async function getBookRecommendationsFromFriend(
  currentUserId: string,
  friendId: string
): Promise<BookRecommendation[]> {
  return getBookRecommendations(currentUserId, {
    direction: "received",
    fromUserId: friendId,
  });
}

/**
 * Get all friends who have sent book recommendations, with stats
 */
export async function getFriendsWithBookRecommendations(
  currentUserId: string
): Promise<FriendStats[]> {
  const recs = await getBookRecommendations(currentUserId, {
    direction: "received",
  });

  // Group by sender
  const friendMap = new Map<string, FriendStats>();

  recs.forEach((rec) => {
    if (!friendMap.has(rec.from_user_id)) {
      friendMap.set(rec.from_user_id, {
        user_id: rec.from_user_id,
        display_name: rec.sender_name || "Unknown",
        pending_count: 0,
        total_count: 0,
        hit_count: 0,
        miss_count: 0,
      });
    }

    const stats = friendMap.get(rec.from_user_id)!;
    stats.total_count++;
    if (rec.status === "pending") stats.pending_count++;
    else if (rec.status === "hit") stats.hit_count++;
    else if (rec.status === "miss") stats.miss_count++;
  });

  return Array.from(friendMap.values());
}

/**
 * Get quick stats for book recommendations
 */
export async function getBookQuickStats(
  currentUserId: string
): Promise<QuickStats> {
  const [pending, hits, misses, sent] = await Promise.all([
    getBookRecommendations(currentUserId, {
      direction: "received",
      status: "pending",
    }),
    getBookRecommendations(currentUserId, {
      direction: "received",
      status: "hit",
    }),
    getBookRecommendations(currentUserId, {
      direction: "received",
      status: "miss",
    }),
    getBookRecommendations(currentUserId, { direction: "sent" }),
  ]);

  return {
    queue: pending.length,
    hits: hits.length,
    misses: misses.length,
    sent: sent.length,
  };
}
