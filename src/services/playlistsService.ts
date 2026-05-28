import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import {
  type CatalogMedia,
  type ServiceResponse,
} from "@/services/mediaCatalogService";

export interface Playlist {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistWithMeta extends Playlist {
  item_count: number;
  share_count: number;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_id: string;
  note: string | null;
  position: number;
  created_at: string;
  media: CatalogMedia | null;
  owner_tracker_note: string | null;
  owner_tracker_completed_at: string | null;
  owner_tracker_rating: number | null;
  owner_media_is_edited: boolean;
  owner_media_edited_fields: string[];
}

export interface PlaylistShareWithUser {
  id: string;
  playlist_id: string;
  shared_with_user_id: string;
  created_at: string;
  user_profile: {
    user_id: string;
    display_name: string | null;
  } | null;
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated");

  return user.id;
}

export async function getPlaylists(): Promise<
  ServiceResponse<PlaylistWithMeta[]>
> {
  try {
    const { data, error } = await supabase
      .from("playlists")
      .select(
        "id, owner_id, name, description, is_private, created_at, updated_at",
      )
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const rows = (data || []) as Playlist[];

    const ids = rows.map((row) => row.id);
    if (ids.length === 0) {
      return { data: [], error: null };
    }

    const [
      { data: itemCounts, error: itemCountError },
      { data: shareCounts, error: shareCountError },
    ] = await Promise.all([
      supabase
        .from("playlist_items")
        .select("playlist_id")
        .in("playlist_id", ids),
      supabase
        .from("playlist_shares")
        .select("playlist_id")
        .in("playlist_id", ids),
    ]);

    if (itemCountError) throw itemCountError;
    if (shareCountError) throw shareCountError;

    const itemsByPlaylist = new Map<string, number>();
    for (const row of itemCounts || []) {
      const playlistId = String(row.playlist_id);
      itemsByPlaylist.set(
        playlistId,
        (itemsByPlaylist.get(playlistId) || 0) + 1,
      );
    }

    const sharesByPlaylist = new Map<string, number>();
    for (const row of shareCounts || []) {
      const playlistId = String(row.playlist_id);
      sharesByPlaylist.set(
        playlistId,
        (sharesByPlaylist.get(playlistId) || 0) + 1,
      );
    }

    return {
      data: rows.map((row) => ({
        ...row,
        item_count: itemsByPlaylist.get(row.id) || 0,
        share_count: sharesByPlaylist.get(row.id) || 0,
      })),
      error: null,
    };
  } catch (error) {
    logger.error("Failed to load playlists", { error });
    return { data: null, error: error as Error };
  }
}

export async function getPlaylist(
  playlistId: string,
): Promise<ServiceResponse<Playlist>> {
  try {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("id", playlistId)
      .single();

    if (error) throw error;

    return { data: data as Playlist, error: null };
  } catch (error) {
    logger.error("Failed to load playlist", { error, playlistId });
    return { data: null, error: error as Error };
  }
}

export async function createPlaylist(params: {
  name: string;
  description?: string | null;
  is_private?: boolean;
}): Promise<ServiceResponse<Playlist>> {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("playlists")
      .insert({
        owner_id: userId,
        name: params.name,
        description: params.description ?? null,
        is_private: params.is_private ?? true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return { data: data as Playlist, error: null };
  } catch (error) {
    logger.error("Failed to create playlist", { error, params });
    return { data: null, error: error as Error };
  }
}

export async function updatePlaylist(
  playlistId: string,
  updates: Partial<Pick<Playlist, "name" | "description" | "is_private">>,
): Promise<ServiceResponse<Playlist>> {
  try {
    const { data, error } = await supabase
      .from("playlists")
      .update({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.is_private !== undefined
          ? { is_private: updates.is_private }
          : {}),
      })
      .eq("id", playlistId)
      .select("*")
      .single();

    if (error) throw error;

    return { data: data as Playlist, error: null };
  } catch (error) {
    logger.error("Failed to update playlist", { error, playlistId, updates });
    return { data: null, error: error as Error };
  }
}

export async function deletePlaylist(
  playlistId: string,
): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to delete playlist", { error, playlistId });
    return { data: null, error: error as Error };
  }
}

export async function getPlaylistItems(
  playlistId: string,
): Promise<ServiceResponse<PlaylistItem[]>> {
  try {
    const { data, error } = await supabase.rpc(
      "get_playlist_items_with_owner_context",
      {
        check_playlist_id: playlistId,
      },
    );

    if (error) {
      const message = String(error.message || "");
      const rpcMissing =
        message.includes("get_playlist_items_with_owner_context") ||
        message.includes("Could not find the function") ||
        error.code === "42883" ||
        error.code === "PGRST202";

      if (!rpcMissing) {
        throw error;
      }

      logger.warn("Owner-context playlist RPC unavailable, using fallback", {
        playlistId,
        error,
      });

      const fallback = await supabase
        .from("playlist_items")
        .select("*, media:media_id(*)")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      if (fallback.error) {
        throw fallback.error;
      }

      const fallbackItems = (
        (fallback.data || []) as Array<
          Omit<
            PlaylistItem,
            | "owner_tracker_note"
            | "owner_tracker_completed_at"
            | "owner_tracker_rating"
            | "owner_media_is_edited"
            | "owner_media_edited_fields"
          >
        >
      ).map((row) => ({
        ...row,
        owner_tracker_note: null,
        owner_tracker_completed_at: null,
        owner_tracker_rating: null,
        owner_media_is_edited: false,
        owner_media_edited_fields: [],
      }));

      return { data: fallbackItems, error: null };
    }

    const items = (
      (data || []) as Array<
        Omit<PlaylistItem, "media"> & {
          media: CatalogMedia | null;
        }
      >
    ).map((row) => ({
      ...row,
      owner_tracker_note: row.owner_tracker_note ?? null,
      owner_tracker_completed_at: row.owner_tracker_completed_at ?? null,
      owner_tracker_rating:
        typeof row.owner_tracker_rating === "number"
          ? row.owner_tracker_rating
          : null,
      owner_media_is_edited: row.owner_media_is_edited === true,
      owner_media_edited_fields: Array.isArray(row.owner_media_edited_fields)
        ? row.owner_media_edited_fields
        : [],
      media: row.media,
    }));

    return { data: items, error: null };
  } catch (error) {
    logger.error("Failed to load playlist items", { error, playlistId });
    return { data: null, error: error as Error };
  }
}

export async function addPlaylistItem(params: {
  playlistId: string;
  mediaId: string;
  note?: string | null;
}): Promise<ServiceResponse<PlaylistItem>> {
  try {
    const { data: lastRow, error: lastError } = await supabase
      .from("playlist_items")
      .select("position")
      .eq("playlist_id", params.playlistId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastError) throw lastError;

    const nextPosition = (lastRow?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from("playlist_items")
      .insert({
        playlist_id: params.playlistId,
        media_id: params.mediaId,
        note: params.note ?? null,
        position: nextPosition,
      })
      .select("*, media:media_id(*)")
      .single();

    if (error) throw error;

    return {
      data: {
        ...(data as PlaylistItem),
        owner_tracker_note: null,
        owner_tracker_completed_at: null,
        owner_tracker_rating: null,
        owner_media_is_edited: false,
        owner_media_edited_fields: [],
      },
      error: null,
    };
  } catch (error) {
    logger.error("Failed to add playlist item", {
      error,
      playlistId: params.playlistId,
      mediaId: params.mediaId,
    });
    return { data: null, error: error as Error };
  }
}

export async function updatePlaylistItem(
  playlistItemId: string,
  updates: Partial<Pick<PlaylistItem, "note" | "position">>,
): Promise<ServiceResponse<PlaylistItem>> {
  try {
    const { data, error } = await supabase
      .from("playlist_items")
      .update(updates)
      .eq("id", playlistItemId)
      .select("*, media:media_id(*)")
      .single();

    if (error) throw error;

    return {
      data: {
        ...(data as PlaylistItem),
        owner_tracker_note: null,
        owner_tracker_completed_at: null,
        owner_tracker_rating: null,
        owner_media_is_edited: false,
        owner_media_edited_fields: [],
      },
      error: null,
    };
  } catch (error) {
    logger.error("Failed to update playlist item", { error, playlistItemId });
    return { data: null, error: error as Error };
  }
}

export async function removePlaylistItem(
  playlistItemId: string,
): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("playlist_items")
      .delete()
      .eq("id", playlistItemId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to remove playlist item", { error, playlistItemId });
    return { data: null, error: error as Error };
  }
}

export async function reorderPlaylistItems(params: {
  playlistId: string;
  orderedItemIds: string[];
}): Promise<ServiceResponse<true>> {
  try {
    const updates = params.orderedItemIds.map((id, index) =>
      supabase
        .from("playlist_items")
        .update({ position: index })
        .eq("id", id)
        .eq("playlist_id", params.playlistId),
    );

    const results = await Promise.all(updates);

    const firstError = results.find((row) => row.error)?.error;
    if (firstError) throw firstError;

    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to reorder playlist items", {
      error,
      playlistId: params.playlistId,
    });
    return { data: null, error: error as Error };
  }
}

export async function getPlaylistShares(
  playlistId: string,
): Promise<ServiceResponse<PlaylistShareWithUser[]>> {
  try {
    const { data: rows, error } = await supabase
      .from("playlist_shares")
      .select("*")
      .eq("playlist_id", playlistId);

    if (error) throw error;

    const shareRows =
      (rows as Array<{
        id: string;
        playlist_id: string;
        shared_with_user_id: string;
        created_at: string;
      }>) || [];

    if (shareRows.length === 0) {
      return { data: [], error: null };
    }

    const userIds = shareRows.map((row) => row.shared_with_user_id);
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (profileError) throw profileError;

    const profileMap = new Map<
      string,
      { user_id: string; display_name: string | null }
    >();
    for (const profile of profiles || []) {
      profileMap.set(profile.user_id, {
        user_id: profile.user_id,
        display_name: profile.display_name,
      });
    }

    return {
      data: shareRows.map((row) => ({
        ...row,
        user_profile: profileMap.get(row.shared_with_user_id) || null,
      })),
      error: null,
    };
  } catch (error) {
    logger.error("Failed to load playlist shares", { error, playlistId });
    return { data: null, error: error as Error };
  }
}

export async function sharePlaylist(params: {
  playlistId: string;
  userIds: string[];
}): Promise<ServiceResponse<true>> {
  try {
    if (params.userIds.length === 0) return { data: true, error: null };

    const userId = await getCurrentUserId();

    const { data: connections, error: connError } = await supabase
      .from("connections")
      .select("user_id, friend_id")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (connError) throw connError;

    const connectedUserIds = new Set<string>();
    for (const connection of connections || []) {
      if (connection.user_id === userId) {
        connectedUserIds.add(connection.friend_id);
      }
      if (connection.friend_id === userId) {
        connectedUserIds.add(connection.user_id);
      }
    }

    const invalidUserIds = params.userIds.filter(
      (candidate) => !connectedUserIds.has(candidate),
    );

    if (invalidUserIds.length > 0) {
      throw new Error("Can only share playlists with connected users");
    }

    const rows = params.userIds.map((sharedWithUserId) => ({
      playlist_id: params.playlistId,
      shared_with_user_id: sharedWithUserId,
    }));

    const { error } = await supabase
      .from("playlist_shares")
      .upsert(rows, { onConflict: "playlist_id,shared_with_user_id" });

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to share playlist", {
      error,
      playlistId: params.playlistId,
    });
    return { data: null, error: error as Error };
  }
}

export async function unsharePlaylist(params: {
  playlistId: string;
  userId: string;
}): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("playlist_shares")
      .delete()
      .eq("playlist_id", params.playlistId)
      .eq("shared_with_user_id", params.userId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to unshare playlist", {
      error,
      playlistId: params.playlistId,
      userId: params.userId,
    });
    return { data: null, error: error as Error };
  }
}
