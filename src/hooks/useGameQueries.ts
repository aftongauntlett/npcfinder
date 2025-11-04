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
export function useGameRecommendations(view: string, friendId?: string) {
  return useRecommendations(view, friendId, "games");
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
