/**
 * Media Lists Service - Supabase Implementation
 * Handles CRUD operations for user-created media lists + sharing (viewer/editor)
 */

import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import type { MediaItem } from "../components/shared/media/SendMediaModal";
import type {
  MediaDomain,
  MediaList,
  MediaListItem,
  MediaListMemberRole,
  MediaListMemberWithUser,
  MediaListWithCounts,
  ServiceResponse,
  UserProfileLite,
} from "./mediaListsService.types";

function normalizeMediaType(
  domain: MediaDomain,
  item: MediaItem
): MediaListItem["media_type"] {
  if (domain === "movies-tv") {
    return item.media_type === "tv" ? "tv" : "movie";
  }
  if (domain === "books") return "book";
  if (domain === "games") return "game";

  // music
  if (item.media_type === "album") return "album";
  if (item.media_type === "playlist") return "playlist";
  return "song";
}

function normalizeYear(releaseDate: string | null | undefined): number | null {
  if (!releaseDate) return null;
  const year = Number(releaseDate.split("-")[0]);
  return Number.isFinite(year) ? year : null;
}

export async function getMediaLists(
  mediaDomain: MediaDomain
): Promise<ServiceResponse<MediaListWithCounts[]>> {
  try {
    const { data, error } = await supabase
      .from("media_lists_with_counts")
      .select("*")
      .eq("media_domain", mediaDomain)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return { data: (data || []) as MediaListWithCounts[], error: null };
  } catch (error) {
    logger.error("Failed to fetch media lists", { error, mediaDomain });
    return { data: null, error: error as Error };
  }
}

export async function getMediaList(
  listId: string
): Promise<ServiceResponse<MediaListWithCounts>> {
  try {
    const { data, error } = await supabase
      .from("media_lists_with_counts")
      .select("*")
      .eq("id", listId)
      .single();

    if (error) throw error;
    return { data: data as MediaListWithCounts, error: null };
  } catch (error) {
    logger.error("Failed to fetch media list", { error, listId });
    return { data: null, error: error as Error };
  }
}

export async function createMediaList(params: {
  media_domain: MediaDomain;
  title: string;
  description?: string | null;
  is_public: boolean;
}): Promise<ServiceResponse<MediaList>> {
  try {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("media_lists")
      .insert({
        owner_id: authData.user.id,
        media_domain: params.media_domain,
        title: params.title,
        description: params.description ?? null,
        is_public: params.is_public,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { data: data as MediaList, error: null };
  } catch (error) {
    logger.error("Failed to create media list", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function updateMediaList(
  listId: string,
  updates: Partial<Pick<MediaList, "title" | "description" | "is_public">>
): Promise<ServiceResponse<MediaList>> {
  try {
    const { data, error } = await supabase
      .from("media_lists")
      .update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.is_public !== undefined
          ? { is_public: updates.is_public }
          : {}),
      })
      .eq("id", listId)
      .select("*")
      .single();

    if (error) throw error;
    return { data: data as MediaList, error: null };
  } catch (error) {
    logger.error("Failed to update media list", { error, listId, updates });
    return { data: null, error: error as Error };
  }
}

export async function deleteMediaList(
  listId: string
): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from("media_lists").delete().eq("id", listId);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to delete media list", { error, listId });
    return { data: null, error: error as Error };
  }
}

export async function getMediaListItems(
  listId: string
): Promise<ServiceResponse<MediaListItem[]>> {
  try {
    const { data, error } = await supabase
      .from("media_list_items")
      .select("*")
      .eq("list_id", listId)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { data: (data || []) as MediaListItem[], error: null };
  } catch (error) {
    logger.error("Failed to fetch media list items", { error, listId });
    return { data: null, error: error as Error };
  }
}

export async function addMediaListItem(params: {
  listId: string;
  mediaDomain: MediaDomain;
  item: MediaItem;
}): Promise<ServiceResponse<MediaListItem>> {
  try {
    const mediaType = normalizeMediaType(params.mediaDomain, params.item);

    const record = {
      list_id: params.listId,
      external_id: params.item.external_id,
      media_type: mediaType,
      title: params.item.title,
      subtitle:
        params.item.subtitle ??
        params.item.artist ??
        params.item.authors ??
        params.item.platforms ??
        null,
      poster_url: params.item.poster_url,
      release_date: params.item.release_date ?? null,
      description: params.item.description ?? params.item.description_raw ?? null,
      year: normalizeYear(params.item.release_date ?? null),
      genres: params.item.genres ?? params.item.genre ?? params.item.categories ?? null,
      authors: params.item.authors ?? null,
      artist: params.item.artist ?? null,
      album: params.item.album ?? null,
      track_duration: params.item.track_duration ?? null,
      track_count: params.item.track_count ?? null,
      preview_url: params.item.preview_url ?? null,
      platforms: params.item.platforms ?? null,
      metacritic: params.item.metacritic ?? null,
      playtime: params.item.playtime ?? null,
      isbn: params.item.isbn ?? null,
      page_count: params.item.page_count ?? null,
      publisher: undefined as unknown as null,
    };

    // publisher is not provided by adapters today; keep null to satisfy type
    (record as Record<string, unknown>).publisher = null;

    const { data, error } = await supabase
      .from("media_list_items")
      .insert(record)
      .select("*")
      .single();

    if (error) throw error;
    return { data: data as MediaListItem, error: null };
  } catch (error) {
    logger.error("Failed to add media list item", {
      error,
      listId: params.listId,
      mediaDomain: params.mediaDomain,
      externalId: params.item.external_id,
    });
    return { data: null, error: error as Error };
  }
}

export async function removeMediaListItem(params: {
  itemId: string;
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_list_items")
      .delete()
      .eq("id", params.itemId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to remove media list item", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function getMediaListMembers(
  listId: string
): Promise<ServiceResponse<MediaListMemberWithUser[]>> {
  try {
    const { data: members, error: membersError } = await supabase
      .from("media_list_members")
      .select("*")
      .eq("list_id", listId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return { data: [], error: null };

    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map<string, UserProfileLite>(
      (profiles || []).map((p) => [p.user_id, p as UserProfileLite])
    );

    const combined = members.map((m) => ({
      ...(m as MediaListMember),
      user_profile: profileMap.get(m.user_id) || null,
    }));

    return { data: combined as MediaListMemberWithUser[], error: null };
  } catch (error) {
    logger.error("Failed to fetch media list members", { error, listId });
    return { data: null, error: error as Error };
  }
}

export async function getMyMediaListRole(
  listId: string
): Promise<ServiceResponse<MediaListMemberRole | null>> {
  try {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("media_list_members")
      .select("role")
      .eq("list_id", listId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (error) throw error;
    return { data: (data?.role as MediaListMemberRole) ?? null, error: null };
  } catch (error) {
    logger.error("Failed to fetch my media list role", { error, listId });
    return { data: null, error: error as Error };
  }
}

export async function shareMediaList(params: {
  listId: string;
  userIds: string[];
  role: MediaListMemberRole;
}): Promise<ServiceResponse<true>> {
  try {
    if (params.userIds.length === 0) return { data: true, error: null };

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error("User not authenticated");

    // Mirror the board sharing rule: only allow invites to connected users.
    const { data: connections, error: connError } = await supabase
      .from("connections")
      .select("friend_id")
      .eq("user_id", authData.user.id)
      .in("friend_id", params.userIds);

    if (connError) throw connError;

    const connectedUserIds = new Set((connections || []).map((c) => c.friend_id));
    const invalidUsers = params.userIds.filter((id) => !connectedUserIds.has(id));
    if (invalidUsers.length > 0) {
      throw new Error("Can only invite connected users (friends)");
    }

    const rows = params.userIds.map((userId) => ({
      list_id: params.listId,
      user_id: userId,
      role: params.role,
      invited_by: authData.user.id,
    }));

    const { error } = await supabase.from("media_list_members").upsert(rows, {
      onConflict: "list_id,user_id",
    });

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to share media list", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function unshareMediaList(params: {
  listId: string;
  userId: string;
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_list_members")
      .delete()
      .eq("list_id", params.listId)
      .eq("user_id", params.userId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to unshare media list", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function updateMediaListMemberRole(params: {
  memberId: string;
  role: MediaListMemberRole;
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_list_members")
      .update({ role: params.role })
      .eq("id", params.memberId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to update media list member role", { error, params });
    return { data: null, error: error as Error };
  }
}
