import type { PostgrestError } from "@supabase/supabase-js";
import { mockUsers } from "../data/mockData";
import { logger } from "./logger";

/**
 * Mock implementation of connections/friends for local development
 * In mock mode, everyone is automatically connected!
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
 * Mock: Get all friends/connections for a user
 * In mock mode, returns all users except the current user
 */
export const getFriends = async (
  currentUserId: string
): Promise<ConnectionsResult<Friend[]>> => {
  logger.debug("🎭 [MOCK] Getting connections for user:", currentUserId);

  // Return all mock users except the current user
  const friends = mockUsers
    .filter((user) => user.user_id !== currentUserId)
    .map((user) => ({
      user_id: user.user_id,
      display_name: user.display_name,
    }));

  return { data: friends, error: null };
};

/**
 * Mock: Check if two users are connected
 */
export const areConnected = async (
  userId1: string,
  userId2: string
): Promise<ConnectionsResult<boolean>> => {
  logger.debug("🎭 [MOCK] Checking connection between:", userId1, userId2);

  // In mock mode, everyone is connected!
  const isConnected = userId1 !== userId2;

  return { data: isConnected, error: null };
};
