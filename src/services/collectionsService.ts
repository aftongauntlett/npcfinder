/**
 * Collections Service - Supabase Implementation
 *
 * Collections are stored in existing tables (media_lists + media_list_items).
 */

import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import type { MediaItem } from "../components/shared/media/SendMediaModal";
import type {
  Collection,
  CollectionItem,
  CollectionItemInsert,
  CollectionMemberRole,
  CollectionMemberWithUser,
  CollectionMembershipForMediaItem,
  CollectionWithCounts,
  MediaDomain,
  ServiceResponse,
  UserProfileLite,
} from "./collectionsServiceTypes";

export async function getCollections(
  mediaDomain: MediaDomain,
): Promise<ServiceResponse<CollectionWithCounts[]>> {
  try {
    const { data, error } = await supabase
      .from("media_lists_with_counts")
      .select("*")
      .eq("media_domain", mediaDomain)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return { data: (data || []) as CollectionWithCounts[], error: null };
  } catch (error) {
    logger.error("Failed to fetch collections", { error, mediaDomain });
    return { data: null, error: error as Error };
  }
}

export async function getAllAccessibleCollections(): Promise<
  ServiceResponse<CollectionWithCounts[]>
> {
  try {
    const { data, error } = await supabase
      .from("media_lists_with_counts")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return { data: (data || []) as CollectionWithCounts[], error: null };
  } catch (error) {
    logger.error("Failed to fetch accessible collections", { error });
    return { data: null, error: error as Error };
  }
}

export async function getCollection(
  collectionId: string,
): Promise<ServiceResponse<CollectionWithCounts>> {
  try {
    const { data, error } = await supabase
      .from("media_lists_with_counts")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (error) throw error;
    return { data: data as CollectionWithCounts, error: null };
  } catch (error) {
    logger.error("Failed to fetch collection", { error, collectionId });
    return { data: null, error: error as Error };
  }
}

export async function createCollection(params: {
  media_domain: MediaDomain;
  title: string;
  description?: string | null;
  icon?: string | null;
  icon_color?: string | null;
  is_public: boolean;
}): Promise<ServiceResponse<Collection>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("media_lists")
      .insert({
        owner_id: authData.user.id,
        media_domain: params.media_domain,
        title: params.title,
        description: params.description ?? null,
        icon: params.icon ?? null,
        icon_color: params.icon_color ?? null,
        is_public: params.is_public,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { data: data as Collection, error: null };
  } catch (error) {
    logger.error("Failed to create collection", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function updateCollection(
  collectionId: string,
  updates: Partial<
    Pick<
      Collection,
      "title" | "description" | "icon" | "icon_color" | "is_public"
    >
  >,
): Promise<ServiceResponse<Collection>> {
  try {
    const { data, error } = await supabase
      .from("media_lists")
      .update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
        ...(updates.icon_color !== undefined
          ? { icon_color: updates.icon_color }
          : {}),
        ...(updates.is_public !== undefined
          ? { is_public: updates.is_public }
          : {}),
      })
      .eq("id", collectionId)
      .select("*")
      .single();

    if (error) throw error;
    return { data: data as Collection, error: null };
  } catch (error) {
    logger.error("Failed to update collection", {
      error,
      collectionId,
      updates,
    });
    return { data: null, error: error as Error };
  }
}

export async function deleteCollection(
  collectionId: string,
): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_lists")
      .delete()
      .eq("id", collectionId);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to delete collection", { error, collectionId });
    return { data: null, error: error as Error };
  }
}

export async function getCollectionItems(
  collectionId: string,
): Promise<ServiceResponse<CollectionItem[]>> {
  try {
    const { data, error } = await supabase
      .from("media_list_items")
      .select("*")
      .eq("list_id", collectionId)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { data: (data || []) as CollectionItem[], error: null };
  } catch (error) {
    logger.error("Failed to fetch collection items", { error, collectionId });
    return { data: null, error: error as Error };
  }
}

function normalizeMediaType(
  domain: MediaDomain,
  item: MediaItem,
): CollectionItem["media_type"] {
  if (domain === "mixed") {
    const raw = item.media_type;
    if (
      raw === "movie" ||
      raw === "tv" ||
      raw === "book" ||
      raw === "game" ||
      raw === "song" ||
      raw === "album" ||
      raw === "playlist"
    ) {
      return raw;
    }

    if (raw === "track") return "song";
    if (raw === "collection") return "album";

    return "movie";
  }

  if (domain === "movies-tv") {
    return item.media_type === "tv" ? "tv" : "movie";
  }
  if (domain === "books") return "book";
  if (domain === "games") return "game";

  if (item.media_type === "album") return "album";
  if (item.media_type === "playlist") return "playlist";
  return "song";
}

function normalizeYear(releaseDate: string | null | undefined): number | null {
  if (!releaseDate) return null;
  const year = Number(releaseDate.split("-")[0]);
  return Number.isFinite(year) ? year : null;
}

export async function addMediaItemToCollection(params: {
  collectionId: string;
  item: CollectionItemInsert;
}): Promise<ServiceResponse<CollectionItem>> {
  try {
    const { data, error } = await supabase
      .from("media_list_items")
      .insert({
        list_id: params.collectionId,
        ...params.item,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { data: data as CollectionItem, error: null };
  } catch (error) {
    logger.error("Failed to add media item to collection", {
      error,
      collectionId: params.collectionId,
      externalId: params.item.external_id,
      mediaType: params.item.media_type,
    });
    return { data: null, error: error as Error };
  }
}

export async function addCollectionItem(params: {
  collectionId: string;
  mediaDomain: MediaDomain;
  item: MediaItem;
}): Promise<ServiceResponse<CollectionItem>> {
  try {
    const mediaType = normalizeMediaType(params.mediaDomain, params.item);

    const insert: CollectionItemInsert = {
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
      description:
        params.item.description ?? params.item.description_raw ?? null,
      year: normalizeYear(params.item.release_date ?? null),
      genres:
        params.item.genres ??
        params.item.genre ??
        params.item.categories ??
        null,
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
      publisher: null,
      sort_order: null,
    };

    return await addMediaItemToCollection({
      collectionId: params.collectionId,
      item: insert,
    });
  } catch (error) {
    logger.error("Failed to add collection item", {
      error,
      collectionId: params.collectionId,
      mediaDomain: params.mediaDomain,
      externalId: params.item.external_id,
    });
    return { data: null, error: error as Error };
  }
}

export async function removeMediaItemFromCollection(params: {
  collectionId: string;
  externalId: string;
  mediaType: CollectionItem["media_type"];
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_list_items")
      .delete()
      .eq("list_id", params.collectionId)
      .eq("external_id", params.externalId)
      .eq("media_type", params.mediaType);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to remove media item from collection", {
      error,
      params,
    });
    return { data: null, error: error as Error };
  }
}

export async function removeCollectionItem(params: {
  collectionId: string;
  itemId: string;
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_list_items")
      .delete()
      .eq("id", params.itemId)
      .eq("list_id", params.collectionId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to remove collection item", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function getCollectionMembershipForMediaItem(params: {
  externalId: string;
  mediaType: CollectionItem["media_type"];
  mediaDomain?: MediaDomain;
}): Promise<ServiceResponse<CollectionMembershipForMediaItem[]>> {
  try {
    const { data: items, error: itemsError } = await supabase
      .from("media_list_items")
      .select("id, list_id")
      .eq("external_id", params.externalId)
      .eq("media_type", params.mediaType);

    if (itemsError) throw itemsError;
    const rawMembership = (items || []).map((row) => ({
      collection_id: String((row as { list_id: string }).list_id),
      collection_item_id: String((row as { id: string }).id),
    }));

    if (!params.mediaDomain || rawMembership.length === 0) {
      return { data: rawMembership, error: null };
    }

    const collectionIds = rawMembership.map(
      (membership) => membership.collection_id,
    );
    const { data: collections, error: collectionsError } = await supabase
      .from("media_lists")
      .select("id")
      .eq("media_domain", params.mediaDomain)
      .in("id", collectionIds);

    if (collectionsError) throw collectionsError;
    const allowed = new Set(
      (collections || []).map((collection) => String(collection.id)),
    );

    return {
      data: rawMembership.filter((membership) =>
        allowed.has(membership.collection_id),
      ),
      error: null,
    };
  } catch (error) {
    logger.error("Failed to fetch collection membership for media item", {
      error,
      externalId: params.externalId,
      mediaType: params.mediaType,
      mediaDomain: params.mediaDomain,
    });
    return { data: null, error: error as Error };
  }
}

export async function getCollectionMembers(
  collectionId: string,
): Promise<ServiceResponse<CollectionMemberWithUser[]>> {
  try {
    const { data: members, error: membersError } = await supabase
      .from("media_list_members")
      .select("*")
      .eq("list_id", collectionId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return { data: [], error: null };

    const userIds = members.map((member) => member.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map<string, UserProfileLite>(
      (profiles || []).map((profile) => [
        profile.user_id,
        profile as UserProfileLite,
      ]),
    );

    const combined = members.map((member) => ({
      ...member,
      user_profile: profileMap.get(member.user_id) || null,
    }));

    return { data: combined as CollectionMemberWithUser[], error: null };
  } catch (error) {
    logger.error("Failed to fetch collection members", {
      error,
      collectionId,
    });
    return { data: null, error: error as Error };
  }
}

export async function getMyCollectionRole(
  collectionId: string,
): Promise<ServiceResponse<CollectionMemberRole | null>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("media_list_members")
      .select("role")
      .eq("list_id", collectionId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (error) throw error;
    return { data: (data?.role as CollectionMemberRole) ?? null, error: null };
  } catch (error) {
    logger.error("Failed to fetch my collection role", { error, collectionId });
    return { data: null, error: error as Error };
  }
}

export async function shareCollection(params: {
  collectionId: string;
  userIds: string[];
  role: CollectionMemberRole;
}): Promise<ServiceResponse<true>> {
  try {
    if (params.userIds.length === 0) return { data: true, error: null };

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error("User not authenticated");

    const { data: connections, error: connError } = await supabase
      .from("connections")
      .select("friend_id")
      .eq("user_id", authData.user.id)
      .in("friend_id", params.userIds);

    if (connError) throw connError;

    const connectedUserIds = new Set(
      (connections || []).map((connection) => connection.friend_id),
    );
    const invalidUsers = params.userIds.filter(
      (id) => !connectedUserIds.has(id),
    );
    if (invalidUsers.length > 0) {
      throw new Error("Can only invite connected users (friends)");
    }

    const rows = params.userIds.map((userId) => ({
      list_id: params.collectionId,
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
    logger.error("Failed to share collection", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function unshareCollection(params: {
  collectionId: string;
  userId: string;
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_list_members")
      .delete()
      .eq("list_id", params.collectionId)
      .eq("user_id", params.userId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to unshare collection", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function updateCollectionMemberRole(params: {
  memberId: string;
  role: CollectionMemberRole;
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("media_list_members")
      .update({ role: params.role })
      .eq("id", params.memberId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to update collection member role", {
      error,
      params,
    });
    return { data: null, error: error as Error };
  }
}
