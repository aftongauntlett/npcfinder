export type MediaDomain = "movies-tv" | "books" | "games" | "music";

export type MediaListMemberRole = "viewer" | "editor";

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface MediaList {
  id: string;
  owner_id: string;
  media_domain: MediaDomain;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaListWithCounts extends MediaList {
  owner_display_name: string;
  item_count: number;
}

export interface MediaListItem {
  id: string;
  list_id: string;
  external_id: string;
  media_type: "movie" | "tv" | "book" | "game" | "song" | "album" | "playlist";
  title: string;
  subtitle: string | null;
  poster_url: string | null;
  release_date: string | null;
  description: string | null;
  year: number | null;
  genres: string | null;
  authors: string | null;
  artist: string | null;
  album: string | null;
  track_duration: number | null;
  track_count: number | null;
  preview_url: string | null;
  platforms: string | null;
  metacritic: number | null;
  playtime: number | null;
  isbn: string | null;
  page_count: number | null;
  publisher: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface MediaListMember {
  id: string;
  list_id: string;
  user_id: string;
  role: MediaListMemberRole;
  invited_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileLite {
  user_id: string;
  display_name: string | null;
}

export interface MediaListMemberWithUser extends MediaListMember {
  user_profile: UserProfileLite | null;
}
