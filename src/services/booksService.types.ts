/**
 * Type definitions for Books service
 * Mirrors Google Books API structure
 */

export interface ReadingListItem {
  id: string;
  user_id: string;
  external_id: string; // Google Books Volume ID
  title: string;
  author: string | null;
  thumbnail_url: string | null;
  published_date: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  read: boolean;
  personal_rating: number | null;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookRecommendation {
  id: string;
  sender_id: string;
  recipient_id: string;
  external_id: string;
  title: string;
  author: string | null;
  thumbnail_url: string | null;
  published_date: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  sender_note: string | null;
  recipient_note: string | null;
  status: "pending" | "opened" | "added" | "dismissed";
  created_at: string;
  updated_at: string;
}
