/**
 * TanStack Query hooks for Music page
 * Delegates to generic useRecommendations hooks
 */

import {
  useFriendsWithRecs,
  useQuickStats,
  useRecommendations,
  useUpdateStatus,
  useDeleteRec,
  useUpdateSenderNote as useUpdateSenderNoteGeneric,
} from "./useRecommendations";

/**
 * Get friends who have sent music recommendations
 */
export function useFriendsWithMusicRecs() {
  return useFriendsWithRecs("music");
}

/**
 * Get quick stats for music
 */
export function useMusicStats() {
  return useQuickStats("music");
}

/**
 * Get music recommendations with filters
 */
export function useMusicRecommendations(view: string, friendId?: string) {
  return useRecommendations(view, friendId, "music");
}

/**
 * Update recommendation status mutation
 */
export function useUpdateRecommendationStatus() {
  return useUpdateStatus("music");
}

/**
 * Delete recommendation mutation
 */
export function useDeleteRecommendation() {
  return useDeleteRec("music");
}

/**
 * Update sender note mutation
 */
export function useUpdateSenderNote() {
  return useUpdateSenderNoteGeneric("music");
}
