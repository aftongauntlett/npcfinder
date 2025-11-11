/**
 * TanStack Query hooks for Games page
 * Delegates to generic useRecommendations hooks
 */

import {
  useFriendsWithRecs,
  useQuickStats,
  useRecommendations,
  useUpdateStatus,
  useDeleteRec,
  useUpdateSenderNote as useUpdateSenderNoteGeneric,
  useUpdateRecipientNote as useUpdateRecipientNoteGeneric,
  useMarkRecommendationsAsOpened as useMarkRecommendationsAsOpenedGeneric,
} from "./useRecommendations";

// Game-specific recommendation type
// Note: Games use separate schema, not part of base Recommendation type
export interface GameRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  poster_url: string | null;
  recommendation_type: string;
  status: string;
  sent_message?: string;
  sender_note?: string;
  recipient_note?: string;
  created_at: string;
  watched_at?: string;
  opened_at?: string;
  sender_name?: string;
  recipient_name?: string;
  // Game-specific fields
  name?: string;
  slug?: string;
  platforms?: string;
  genres?: string;
  released?: string;
  background_image?: string;
  rating?: number;
  metacritic?: number;
  playtime?: number;
  played_at?: string;
  sent_at?: string;
  consumed_at?: string | null;
  comment?: string | null;
  sender_comment?: string | null;
}

/**
 * Get friends who have sent game recommendations
 */
export function useFriendsWithGameRecs() {
  return useFriendsWithRecs("games");
}

/**
 * Get quick stats for games
 */
export function useGameStats() {
  return useQuickStats("games");
}

/**
 * Get game recommendations with filters
 */
export function useGameRecommendations(
  view: "overview" | "queue" | "friend" | "hits" | "misses" | "sent",
  friendId?: string
) {
  return useRecommendations<GameRecommendation>(view, friendId, "games");
}

/**
 * Update recommendation status mutation
 */
export function useUpdateGameRecommendationStatus() {
  return useUpdateStatus("games");
}

/**
 * Delete recommendation mutation
 */
export function useDeleteGameRecommendation() {
  return useDeleteRec("games");
}

/**
 * Update sender's note mutation
 */
export function useUpdateSenderNote() {
  return useUpdateSenderNoteGeneric("games");
}

/**
 * Update recipient's note mutation
 */
export function useUpdateRecipientNote() {
  return useUpdateRecipientNoteGeneric("games");
}

/**
 * Mark all pending recommendations as opened (for badge dismissal)
 */
export function useMarkGameRecommendationsAsOpened() {
  return useMarkRecommendationsAsOpenedGeneric("games");
}
