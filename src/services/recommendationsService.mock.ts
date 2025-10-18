/**
 * Recommendations Service Layer
 * Separates data/API logic from React components
 * Makes it easy to swap mock data for real database later
 */

import {
  mockApi,
  getUserProfile as getMockUserProfile,
  CURRENT_USER_ID,
  type Recommendation,
  type UserProfile,
} from "../data/mockData";

// ============================================
// TYPES
// ============================================

export interface RecommendationFilters {
  direction?: "received" | "sent";
  mediaType?: "song" | "album" | "movie" | "tv";
  status?: "pending" | "consumed" | "watched" | "hit" | "miss";
  fromUserId?: string;
}

export interface FriendStats {
  user_id: string;
  display_name: string;
  pending_count: number;
  total_count: number;
  hit_count: number;
  miss_count: number;
}

export interface QuickStats {
  hits: number;
  misses: number;
  queue: number;
  sent: number;
}

// ============================================
// USER FUNCTIONS
// ============================================

/**
 * Get user profile by ID
 */
export function getUserProfile(userId: string): UserProfile | null {
  return getMockUserProfile(userId) || null;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string {
  return CURRENT_USER_ID;
}

// ============================================
// RECOMMENDATION QUERIES
// ============================================

/**
 * Get recommendations with filters
 */
export async function getRecommendations(
  filters: RecommendationFilters
): Promise<Recommendation[]> {
  return mockApi.getRecommendations(CURRENT_USER_ID, filters);
}

/**
 * Get recommendations received from a specific friend
 */
export async function getRecommendationsFromFriend(
  friendId: string,
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<Recommendation[]> {
  const allRecs = await mockApi.getRecommendations(CURRENT_USER_ID, {
    direction: "received",
    mediaType,
  });
  return allRecs.filter((rec) => rec.from_user_id === friendId);
}

/**
 * Get all friends who have sent recommendations, with stats
 */
export async function getFriendsWithRecommendations(
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<FriendStats[]> {
  // Get all received recommendations
  const recs = await mockApi.getRecommendations(CURRENT_USER_ID, {
    direction: "received",
    mediaType,
  });

  // Group by sender and count statuses
  const friendMap = new Map<
    string,
    { pending: number; total: number; hits: number; misses: number }
  >();

  recs.forEach((rec) => {
    const existing = friendMap.get(rec.from_user_id) || {
      pending: 0,
      total: 0,
      hits: 0,
      misses: 0,
    };
    existing.total++;
    if (rec.status === "pending") existing.pending++;
    if (rec.status === "hit") existing.hits++;
    if (rec.status === "miss") existing.misses++;
    friendMap.set(rec.from_user_id, existing);
  });

  // Get display names for all friends
  const friendIds = Array.from(friendMap.keys());
  const friends: FriendStats[] = friendIds.map((friendId) => {
    const profile = getMockUserProfile(friendId);
    const stats = friendMap.get(friendId)!;
    return {
      user_id: friendId,
      display_name: profile?.display_name || "Unknown User",
      pending_count: stats.pending,
      total_count: stats.total,
      hit_count: stats.hits,
      miss_count: stats.misses,
    };
  });

  return friends;
}

/**
 * Get quick stats (hits, misses, queue, sent counts)
 */
export async function getQuickStats(
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<QuickStats> {
  // Get received recommendations
  const receivedRecs = await mockApi.getRecommendations(CURRENT_USER_ID, {
    direction: "received",
    mediaType,
  });

  // Get sent recommendations
  const sentRecs = await mockApi.getRecommendations(CURRENT_USER_ID, {
    direction: "sent",
    mediaType,
  });

  return {
    hits: receivedRecs.filter((r) => r.status === "hit").length,
    misses: receivedRecs.filter((r) => r.status === "miss").length,
    queue: receivedRecs.filter((r) => r.status === "pending").length,
    sent: sentRecs.length,
  };
}

// ============================================
// RECOMMENDATION MUTATIONS
// ============================================

/**
 * Update recommendation status (pending → consumed/hit/miss)
 */
export async function updateRecommendationStatus(
  recId: string,
  status: "pending" | "consumed" | "hit" | "miss",
  recipientNote?: string
): Promise<void> {
  await mockApi.updateStatus(recId, status, recipientNote);
}

/**
 * Update sender's personal note on a recommendation they sent
 */
export async function updateSenderNote(
  recId: string,
  senderNote: string
): Promise<void> {
  await mockApi.updateSenderNote(recId, senderNote);
}

/**
 * Delete (unsend) a recommendation
 */
export async function deleteRecommendation(recId: string): Promise<void> {
  await mockApi.deleteRecommendation(recId);
}

/**
 * Mark recommendation(s) as opened (when recipient first views them)
 */
export async function markRecommendationsAsOpened(
  recIds: string[]
): Promise<void> {
  await Promise.all(recIds.map((id) => mockApi.markAsOpened(id)));
}

// ============================================
// USER PROFILE MAPPING
// ============================================

/**
 * Get display names for multiple users
 */
export function getUserProfiles(userIds: string[]): Map<string, string> {
  const profileMap = new Map<string, string>();

  userIds.forEach((userId) => {
    const profile = getMockUserProfile(userId);
    if (profile) {
      profileMap.set(userId, profile.display_name);
    }
  });

  return profileMap;
}
