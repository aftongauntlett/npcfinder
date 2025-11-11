/**
 * Shared types for media page components
 */

/**
 * BaseRecommendation - Canonical shared type for all recommendation interfaces
 * All media-specific recommendation types should extend this
 */
export interface BaseRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  status: string; // Flexible status field - each media type can have specific values
  sent_message: string | null;
  comment: string | null;
  sender_comment: string | null; // Sender's own note on what they sent
  sent_at: string;
  consumed_at?: string | null; // Optional - maps to listened_at/watched_at/read_at/played_at
  opened_at?: string | null;
  poster_url?: string | null;
  // Media-specific fields can be added by extending interfaces
}

/**
 * FriendSummary - Summary of a friend's recommendation activity
 * Used by recommendation layouts to display friend lists and stats
 */
export interface FriendSummary {
  user_id: string;
  display_name: string;
  pending_count: number;
  total_count: number;
  hit_count: number;
  miss_count: number;
}

export interface SortOption {
  id: string;
  label: string;
}
