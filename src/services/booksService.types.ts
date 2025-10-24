/**
 * Type definitions for Books service
 * Field names match Google Books API for consistency
 */

export interface ReadingListItem {
  id: string;
  user_id: string;
  external_id: string; // Google Books Volume ID
  title: string;
  authors: string | null; // Plural to match API (stored as comma-separated string)
  thumbnail_url: string | null;
  published_date: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  read: boolean;
  personal_rating: number | null;
  personal_notes: string | null;
  read_at: string | null; // Timestamp when marked as read
  created_at: string;
  updated_at: string;
}

export interface BookRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  authors: string | null; // Plural to match API (stored as comma-separated string)
  thumbnail_url: string | null;
  published_date: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  sender_note: string | null;
  recipient_note: string | null;
  status: "pending" | "read" | "hit" | "miss";
  read_at: string | null; // Timestamp when marked as read
  created_at: string;
  updated_at: string;
}
