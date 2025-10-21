/**
 * Shared types for recommendations service
 */

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

export interface Recommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  media_type: "song" | "album" | "movie" | "tv";
  title: string;
  artist?: string;
  album?: string;
  release_date?: string;
  overview?: string;
  poster_url?: string;
  year?: number;
  recommendation_type: "watch" | "rewatch" | "listen" | "relisten" | "study";
  status: "pending" | "consumed" | "watched" | "hit" | "miss";
  sent_message?: string;
  sender_note?: string;
  recipient_note?: string;
  created_at: string;
  watched_at?: string;
  opened_at?: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
}
