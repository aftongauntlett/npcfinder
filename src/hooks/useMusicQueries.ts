// TanStack Query hooks for Music page
// Delegates to generic useRecommendations hooks

import {
  useFriendsWithRecs,
  useQuickStats,
  useRecommendations,
  useUpdateStatus,
  useDeleteRec,
  useUpdateSenderNote as useUpdateSenderNoteGeneric,
} from "./useRecommendations";
import type { Recommendation } from "../services/recommendationsService.types";

// Music-specific recommendation type (extends base Recommendation from service)
// Note: Components may transform this further to match their BaseRecommendation interface
export type MusicRecommendation = Recommendation & {
  media_type: "song" | "album";
  artist: string;
  album?: string;
  year?: number;
  poster_url: string | null;
  // Additional fields added by component transformation
  sent_at?: string;
  consumed_at?: string | null;
};

export function useFriendsWithMusicRecs() {
  return useFriendsWithRecs("music");
}

/**
 * Get quick stats for music
 */
export function useMusicStats() {
  return useQuickStats("music");
}

// Get music recommendations with filters
export function useMusicRecommendations(
  view: "overview" | "queue" | "friend" | "hits" | "misses" | "sent",
  friendId?: string
) {
  return useRecommendations<MusicRecommendation>(view, friendId, "music");
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
