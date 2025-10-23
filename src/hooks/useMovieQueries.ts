/**
 * TanStack Query hooks for Movies & TV page
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
 * Get friends who have sent movie/TV recommendations
 * Note: Pass undefined to get BOTH movies and TV shows (they're in the same table)
 */
export function useFriendsWithMovieRecs() {
  return useFriendsWithRecs("movies-tv");
}

/**
 * Get quick stats for movies/TV
 * Note: Pass undefined to get BOTH movies and TV shows (they're in the same table)
 */
export function useMovieStats() {
  return useQuickStats("movies-tv");
}

/**
 * Get movie/TV recommendations with filters
 */
export function useMovieRecommendations(view: string, friendId?: string) {
  return useRecommendations(view, friendId, "movies-tv");
}

/**
 * Update recommendation status mutation
 */
export function useUpdateMovieRecommendationStatus() {
  return useUpdateStatus("movies-tv");
}

/**
 * Delete recommendation mutation
 */
export function useDeleteMovieRecommendation() {
  return useDeleteRec("movies-tv");
}

/**
 * Update sender's note mutation
 */
export function useUpdateSenderNote() {
  return useUpdateSenderNoteGeneric("movies-tv");
}

/**
 * Update recipient's note mutation
 */
export function useUpdateRecipientNote() {
  return useUpdateRecipientNoteGeneric("movies-tv");
}

/**
 * Mark all pending recommendations as opened (for badge dismissal)
 */
export function useMarkMovieRecommendationsAsOpened() {
  return useMarkRecommendationsAsOpenedGeneric("movies-tv");
}
