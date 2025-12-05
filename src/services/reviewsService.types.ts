/**
 * TypeScript types for the media reviews service
 * Ensures type safety across the application for reviews and ratings
 */

export interface MediaReview {
  id: string;
  user_id: string;
  external_id: string;
  media_type: "movie" | "tv" | "song" | "album" | "playlist" | "game" | "book";
  title: string;
  rating: number | null; // 1-5
  review_text: string | null;
  is_public: boolean;
  watched_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  is_edited: boolean;
  edited_at: string | null;
}

export interface MediaReviewWithUser extends MediaReview {
  display_name: string;
}

export interface CreateReviewData {
  user_id: string;
  external_id: string;
  media_type: "movie" | "tv" | "song" | "album" | "playlist" | "game" | "book";
  title: string;
  rating?: number | null;
  review_text?: string | null;
  is_public?: boolean;
  watched_at?: string | null;
}

export interface UpdateReviewData {
  rating?: number | null;
  review_text?: string | null;
  is_public?: boolean;
  watched_at?: string | null;
}

/**
 * Type guard to check if a rating is valid (1-5)
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Type guard to check if a media type is valid
 */
export function isValidMediaType(
  type: string
): type is MediaReview["media_type"] {
  return ["movie", "tv", "song", "album", "playlist", "game", "book"].includes(
    type
  );
}
