/**
 * Recommendations Service - Main Entry Point
 * Switches between mock and real implementation based on VITE_USE_MOCK
 */

import { USE_MOCK_DATA } from "./config";
import { supabase } from "../lib/supabase";
import * as mockService from "./recommendationsService.mock";
import * as realService from "./recommendationsService.real";

// Export types
export type {
  RecommendationFilters,
  FriendStats,
  QuickStats,
  Recommendation,
  UserProfile,
} from "./recommendationsService.types";

/**
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string> {
  if (USE_MOCK_DATA) {
    return mockService.getCurrentUserId();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user");
  }

  return user.id;
}

// ============================================
// RECOMMENDATION QUERIES
// ============================================

/**
 * Get recommendations with filters
 */
export async function getRecommendations(
  filters: import("./recommendationsService.types").RecommendationFilters
): Promise<import("./recommendationsService.types").Recommendation[]> {
  if (USE_MOCK_DATA) {
    return mockService.getRecommendations(filters);
  }
  const userId = await getCurrentUserId();
  return realService.getRecommendations(userId, filters);
}

/**
 * Get recommendations received from a specific friend
 */
export async function getRecommendationsFromFriend(
  friendId: string,
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<import("./recommendationsService.types").Recommendation[]> {
  if (USE_MOCK_DATA) {
    return mockService.getRecommendationsFromFriend(friendId, mediaType);
  }
  const userId = await getCurrentUserId();
  return realService.getRecommendationsFromFriend(userId, friendId, mediaType);
}

/**
 * Get all friends who have sent recommendations, with stats
 */
export async function getFriendsWithRecommendations(
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<import("./recommendationsService.types").FriendStats[]> {
  if (USE_MOCK_DATA) {
    return mockService.getFriendsWithRecommendations(mediaType);
  }
  const userId = await getCurrentUserId();
  return realService.getFriendsWithRecommendations(userId, mediaType);
}

/**
 * Get quick stats for dashboard
 */
export async function getQuickStats(
  mediaType?: "song" | "album" | "movie" | "tv"
): Promise<import("./recommendationsService.types").QuickStats> {
  if (USE_MOCK_DATA) {
    return mockService.getQuickStats(mediaType);
  }
  const userId = await getCurrentUserId();
  return realService.getQuickStats(userId, mediaType);
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Update recommendation status
 */
export async function updateRecommendationStatus(
  recId: string,
  status: "pending" | "consumed" | "watched" | "hit" | "miss",
  mediaType: "song" | "album" | "movie" | "tv"
): Promise<void> {
  const tableName =
    mediaType === "song" || mediaType === "album"
      ? "music_recommendations"
      : "movie_recommendations";

  // Convert status based on media type for database compatibility
  const dbStatus =
    mediaType === "movie" || mediaType === "tv"
      ? status === "consumed"
        ? "watched"
        : status
      : status === "watched"
      ? "consumed"
      : status;

  if (USE_MOCK_DATA) {
    // Mock service uses "consumed" for everything
    const mockStatus = dbStatus === "watched" ? "consumed" : dbStatus;
    return mockService.updateRecommendationStatus(recId, mockStatus);
  }

  return realService.updateRecommendationStatus(recId, dbStatus, tableName);
}

/**
 * Delete a recommendation
 */
export async function deleteRecommendation(recId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    return mockService.deleteRecommendation(recId);
  }

  // Try both tables
  try {
    await realService.deleteRecommendation(recId, "movie_recommendations");
  } catch {
    await realService.deleteRecommendation(recId, "music_recommendations");
  }
}

/**
 * Update sender's note on a recommendation
 */
export async function updateSenderNote(
  recId: string,
  note: string
): Promise<void> {
  if (USE_MOCK_DATA) {
    return mockService.updateSenderNote(recId, note);
  }

  // Try both tables
  try {
    await realService.updateSenderNote(recId, note, "movie_recommendations");
  } catch {
    await realService.updateSenderNote(recId, note, "music_recommendations");
  }
}

/**
 * Update recipient's note on a recommendation
 */
export async function updateRecipientNote(
  recId: string,
  note: string
): Promise<void> {
  if (USE_MOCK_DATA) {
    // Mock service doesn't have this function, skip
    return Promise.resolve();
  }

  // Try both tables
  try {
    await realService.updateRecipientNote(recId, note, "movie_recommendations");
  } catch {
    await realService.updateRecipientNote(recId, note, "music_recommendations");
  }
}

// Legacy exports for mock compatibility
export const getUserProfile = USE_MOCK_DATA ? mockService.getUserProfile : null;
