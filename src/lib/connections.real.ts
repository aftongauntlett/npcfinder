import { supabase } from "./supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

/**
 * Real Supabase implementation for connections/friendships
 */

interface Friend {
  user_id: string;
  display_name: string;
}

interface ConnectionsResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Get all friends/connections for a user from Supabase
 */
export const getFriends = async (
  currentUserId: string
): Promise<ConnectionsResult<Friend[]>> => {
  try {
    // Get connections from connections table
    const { data: connections, error: connectionsError } = await supabase
      .from("connections")
      .select("friend_id, user_id")
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

    if (connectionsError) throw connectionsError;

    // Extract friend IDs
    const friendIds =
      connections?.map((f) =>
        f.user_id === currentUserId ? f.friend_id : f.user_id
      ) || [];

    if (friendIds.length === 0) {
      return { data: [], error: null };
    }

    // Get user profiles for those friends
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", friendIds);

    if (profilesError) throw profilesError;

    const friends =
      profiles?.map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name || "User",
      })) || [];

    return { data: friends, error: null };
  } catch (error) {
    logger.error("Failed to load friends", { error });
    return { data: null, error: error as PostgrestError };
  }
};

/**
 * Check if two users are connected
 */
export const areConnected = async (
  userId1: string,
  userId2: string
): Promise<ConnectionsResult<boolean>> => {
  try {
    const { data, error } = await supabase
      .from("connections")
      .select("id")
      .or(
        `and(user_id.eq.${userId1},friend_id.eq.${userId2}),and(user_id.eq.${userId2},friend_id.eq.${userId1})`
      )
      .limit(1);

    if (error) throw error;

    return { data: (data?.length || 0) > 0, error: null };
  } catch (error) {
    logger.error("Failed to check connection status", { error });
    return { data: null, error: error as PostgrestError };
  }
};
