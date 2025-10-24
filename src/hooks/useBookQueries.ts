/**
 * TanStack Query hooks for Books page
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
 * Get friends who have sent book recommendations
 */
export function useFriendsWithBookRecs() {
  return useFriendsWithRecs("books");
}

/**
 * Get quick stats for books
 */
export function useBookStats() {
  return useQuickStats("books");
}

/**
 * Get book recommendations with filters
 */
export function useBookRecommendations(view: string, friendId?: string) {
  return useRecommendations(view, friendId, "books");
}

/**
 * Update recommendation status mutation
 */
export function useUpdateBookRecommendationStatus() {
  return useUpdateStatus("books");
}

/**
 * Delete recommendation mutation
 */
export function useDeleteBookRecommendation() {
  return useDeleteRec("books");
}

/**
 * Update sender's note mutation
 */
export function useUpdateSenderNote() {
  return useUpdateSenderNoteGeneric("books");
}

/**
 * Update recipient's note mutation
 */
export function useUpdateRecipientNote() {
  return useUpdateRecipientNoteGeneric("books");
}

/**
 * Mark all pending recommendations as opened (for badge dismissal)
 */
export function useMarkBookRecommendationsAsOpened() {
  return useMarkRecommendationsAsOpenedGeneric("books");
}
