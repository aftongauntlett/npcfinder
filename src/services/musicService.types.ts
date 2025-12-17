/**
 * Music Service Types
 * Data structures for the music_library table
 * Matches Spotify/Apple Music API structure and music_recommendations table
 */

export interface MusicLibraryItem {
  id: string;
  user_id: string;
  external_id: string; // Spotify/Apple Music ID
  title: string; // Song, Album, or Playlist name
  artist: string;
  album: string | null; // For songs, the album they belong to
  media_type: "song" | "album" | "playlist"; // Match music_recommendations
  release_date: string | null; // Text format (YYYY-MM-DD or YYYY)
  album_cover_url: string | null; // Album artwork
  preview_url: string | null; // Preview audio URL
  genre: string | null; // Primary genre from iTunes API
  track_duration: number | null; // Track duration in milliseconds (for songs)
  track_count: number | null; // Number of tracks (for albums)
  listened: boolean; // false = listening, true = listened
  personal_rating: number | null; // 1-5 stars
  personal_notes: string | null; // User's thoughts
  created_at: string;
  updated_at: string;
  listened_at: string | null; // When marked as listened
  custom_order: number | null; // For drag-to-reorder functionality
}

export interface AddToLibraryParams {
  external_id: string;
  title: string;
  artist: string;
  album: string | null;
  media_type: "song" | "album" | "playlist";
  release_date: string | null;
  album_cover_url: string | null;
  preview_url?: string | null;
  genre?: string | null;
  track_duration?: number | null;
  track_count?: number | null;
  listened?: boolean;
}

export interface UpdateLibraryParams {
  id: string;
  listened?: boolean;
  personal_rating?: number | null;
  personal_notes?: string | null;
}
