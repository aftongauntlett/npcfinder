/**
 * Collections (data layer)
 *
 * Collections are persisted in existing tables:
 * - public.media_lists
 * - public.media_list_items
 * - public.media_list_members
 */

export type MediaDomain = "movies-tv" | "books" | "games" | "music" | "mixed";

export type CollectionMemberRole = "viewer" | "editor";

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface Collection {
  id: string;
  owner_id: string;
  media_domain: MediaDomain;
  title: string;
  description: string | null;
  icon?: string | null;
  icon_color?: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithCounts extends Collection {
  owner_display_name: string;
  item_count: number;
}

export interface CollectionItem {
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
  created_at: string;
  updated_at: string;
}

export type CollectionItemInsert = Omit<
  CollectionItem,
  "id" | "list_id" | "created_at" | "updated_at"
>;

export interface CollectionMember {
  id: string;
  list_id: string;
  user_id: string;
  role: CollectionMemberRole;
  invited_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileLite {
  user_id: string;
  display_name: string | null;
}

export interface CollectionMemberWithUser extends CollectionMember {
  user_profile: UserProfileLite | null;
}

export interface CollectionMembershipForMediaItem {
  collection_id: string;
  collection_item_id: string;
}
