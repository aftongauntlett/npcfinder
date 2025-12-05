/**
 * User Search Service
 * Handles searching for users and managing connections
 */

import { supabase } from "../lib/supabase";

export interface UserSearchResult {
  user_id: string;
  display_name: string;
  profile_picture_url: string | null;
  is_connected: boolean;
  mutual_friends_count: number;
}

export interface SearchUsersParams {
  query: string;
  currentUserId: string;
  page: number;
  pageSize: number;
}

/**
 * Search for users by display name
 * Excludes current user, shows connection status and mutual friends count
 */
export async function searchUsers({
  query,
  currentUserId,
  page,
  pageSize,
}: SearchUsersParams): Promise<{
  users: UserSearchResult[];
  totalCount: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * pageSize;

  // Build the search query
  let searchQuery = supabase
    .from("user_profiles")
    .select("user_id, display_name, profile_picture_url", { count: "exact" })
    .neq("user_id", currentUserId); // Exclude current user

  // Add search filter if query is provided
  if (query.trim()) {
    searchQuery = searchQuery.ilike("display_name", `%${query.trim()}%`);
  }

  // Apply pagination
  searchQuery = searchQuery
    .order("display_name", { ascending: true })
    .range(offset, offset + pageSize - 1);

  const { data: users, error, count } = await searchQuery;

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  if (!users) {
    return { users: [], totalCount: 0, hasMore: false };
  }

  // Get current user's connections
  const { data: myConnections, error: connectionsError } = await supabase
    .from("connections")
    .select("friend_id")
    .eq("user_id", currentUserId);

  if (connectionsError) {
    console.error("Error fetching connections:", connectionsError);
  }

  const myFriendIds = new Set(myConnections?.map((c) => c.friend_id) || []);

  // Collect all candidate user IDs from the paginated results
  const candidateUserIds = users.map((user) => user.user_id);

  // Fetch all connections for all candidate users in a single query
  const { data: allCandidateConnections, error: candidateConnectionsError } =
    await supabase
      .from("connections")
      .select("user_id, friend_id")
      .in("user_id", candidateUserIds);

  if (candidateConnectionsError) {
    console.error(
      "Error fetching candidate connections:",
      candidateConnectionsError
    );
  }

  // Build a mapping of user_id -> Set<friend_id> for O(1) lookups
  const userConnectionsMap = new Map<string, Set<string>>();
  for (const conn of allCandidateConnections || []) {
    if (!userConnectionsMap.has(conn.user_id)) {
      userConnectionsMap.set(conn.user_id, new Set());
    }
    userConnectionsMap.get(conn.user_id)!.add(conn.friend_id);
  }

  // Map results with precomputed connection data
  const usersWithData = users.map((user) => {
    const isConnected = myFriendIds.has(user.user_id);

    // Calculate mutual friends count
    let mutualCount = 0;
    if (!isConnected) {
      const theirFriendIds = userConnectionsMap.get(user.user_id);
      if (theirFriendIds) {
        // Count intersection between my friends and their friends
        mutualCount = [...myFriendIds].filter((id) =>
          theirFriendIds.has(id)
        ).length;
      }
    }

    return {
      user_id: user.user_id,
      display_name: user.display_name,
      profile_picture_url: user.profile_picture_url,
      is_connected: isConnected,
      mutual_friends_count: mutualCount,
    };
  });

  return {
    users: usersWithData,
    totalCount: count || 0,
    hasMore: (count || 0) > offset + pageSize,
  };
}

/**
 * Create a bidirectional connection between two users
 */
export async function createConnection(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  // Call the database function that creates bidirectional connection
  const { error } = await supabase.rpc("create_bidirectional_connection", {
    user_a: currentUserId,
    user_b: targetUserId,
  });

  if (error) {
    throw new Error(`Failed to create connection: ${error.message}`);
  }
}

/**
 * Remove a connection between two users
 */
export async function removeConnection(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  // Delete both directions
  const { error: error1 } = await supabase
    .from("connections")
    .delete()
    .eq("user_id", currentUserId)
    .eq("friend_id", targetUserId);

  const { error: error2 } = await supabase
    .from("connections")
    .delete()
    .eq("user_id", targetUserId)
    .eq("friend_id", currentUserId);

  if (error1 || error2) {
    throw new Error("Failed to remove connection");
  }
}
