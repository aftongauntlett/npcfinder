// Admin Service - Supabase Implementation
// SECURITY: AdminContext gates route access, RLS enforces backend protection

import { supabase } from "../lib/supabase";
import { logger } from "@/lib/logger";

// Verify current user has admin privileges before admin operations
const verifyAdminAccess = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn("Admin operation attempted without authentication");
      return false;
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (error) {
      logger.error("Failed to fetch user role for verification", {
        error,
        code: error.code,
        message: error.message,
        userId: user.id,
      });
      return false;
    }

    const isAdmin = ["admin", "super_admin"].includes(profile?.role || "user");

    if (!isAdmin) {
      logger.warn(
        `Unauthorized admin operation attempted by user: ${user.id}`,
        {
          role: profile?.role,
        },
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Failed to verify admin access", { error });
    return false;
  }
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export interface AdminStats {
  totalUsers: number;
  deletedUsers: number;
  totalMediaItems: number;
  totalRatings: number;
  totalInviteCodes: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers: number;
  avgRatingsPerUser: number;
}

export interface UserProfile {
  id: string;
  display_name: string;
  email?: string;
  bio?: string;
  role: "user" | "admin" | "super_admin";
  created_at: string;
  updated_at: string;
}

export interface PopularMedia {
  id: string;
  title: string;
  type: string;
  release_year?: number;
  trackingCount: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  media_type: string;
  status?: string;
  created_at: string;
  from_user_id?: string;
  to_user_id?: string;
}

// Fetch admin statistics (requires admin privileges)
export const getAdminStats = async (): Promise<AdminStats> => {
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    { count: inviteCodesCount },
    { count: trackerCount },
    { count: playlistItemCount },
    { count: ratingsCount },
    { count: userCount },
    { count: weekUsers },
    { count: monthUsers },
    { count: deletedCount },
    { data: recentTrackerUsers },
    { data: recentPlaylistOwners },
  ] = await Promise.all([
    supabase.from("invite_codes").select("*", { count: "exact", head: true }),
    supabase.from("tracker_items").select("*", { count: "exact", head: true }),
    supabase.from("playlist_items").select("*", { count: "exact", head: true }),
    supabase
      .from("tracker_items")
      .select("*", { count: "exact", head: true })
      .not("rating", "is", null),
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo.toISOString()),
    supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneMonthAgo.toISOString()),
    supabase
      .from("deleted_users_log")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("tracker_items")
      .select("user_id")
      .gte("updated_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("playlists")
      .select("owner_id")
      .gte("updated_at", thirtyDaysAgo.toISOString()),
  ]);

  const activeUserIds = new Set<string>([
    ...(recentTrackerUsers?.map((item) => item.user_id) || []),
    ...(recentPlaylistOwners?.map((item) => item.owner_id) || []),
  ]);

  const totalUsers = userCount || 0;
  const totalRatings = ratingsCount || 0;

  return {
    totalUsers,
    deletedUsers: deletedCount || 0,
    totalMediaItems: (trackerCount || 0) + (playlistItemCount || 0),
    totalRatings,
    totalInviteCodes: inviteCodesCount || 0,
    newUsersThisWeek: weekUsers || 0,
    newUsersThisMonth: monthUsers || 0,
    activeUsers: activeUserIds.size,
    avgRatingsPerUser:
      totalUsers > 0 ? Math.round(totalRatings / totalUsers) : 0,
  };
};

/**
 * Fetch users with pagination and search
 * SECURITY: Requires admin privileges
 */
export const getUsers = async (
  page: number,
  perPage: number,
  searchTerm: string = "",
): Promise<{ users: UserProfile[]; totalPages: number }> => {
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  let query = supabase
    .from("user_profiles")
    .select("user_id, display_name, email, bio, role, created_at, updated_at", {
      count: "exact",
    });

  if (searchTerm.trim()) {
    query = query.or(
      `display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`,
    );
  }

  const { count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  const { data: allUserProfiles } = await query.order("created_at", {
    ascending: false,
  });

  const allUsers: UserProfile[] =
    allUserProfiles?.map((profile) => ({
      id: profile.user_id,
      display_name: profile.display_name || "No Name Set",
      email: profile.email,
      bio: profile.bio,
      role: profile.role || "user",
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    })) || [];

  const roleOrder = { super_admin: 0, admin: 1, user: 2 };
  allUsers.sort((a, b) => {
    const aOrder = roleOrder[a.role] ?? 3;
    const bOrder = roleOrder[b.role] ?? 3;

    if (aOrder !== bOrder) return aOrder - bOrder;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const startIdx = page * perPage;
  const endIdx = (page + 1) * perPage;
  const users = allUsers.slice(startIdx, endIdx);

  try {
    await supabase.rpc("log_admin_action", {
      p_action: "view_user_list",
      p_target_user_id: null,
      p_details: { page, perPage, searchTerm, totalUsers: count || 0 },
    });
  } catch (error) {
    logger.warn("Failed to log admin action", { error });
  }

  return { users, totalPages };
};

/**
 * Fetch popular media from tracker + playlists
 * SECURITY: Requires admin privileges
 */
export const getPopularMedia = async (): Promise<PopularMedia[]> => {
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  const [{ data: trackerRows }, { data: playlistRows }] = await Promise.all([
    supabase
      .from("tracker_items")
      .select("media_id, media:media_id(id, title, media_type, year)"),
    supabase
      .from("playlist_items")
      .select("media_id, media:media_id(id, title, media_type, year)"),
  ]);

  const mediaCounts = new Map<
    string,
    { count: number; title: string; type: string; release_year?: number }
  >();

  for (const row of [...(trackerRows || []), ...(playlistRows || [])]) {
    const media = firstRelation(
      row.media as
        | {
            id: string;
            title: string;
            media_type: string;
            year?: number | null;
          }
        | Array<{
            id: string;
            title: string;
            media_type: string;
            year?: number | null;
          }>
        | null,
    );

    if (!media?.id) continue;

    const existing = mediaCounts.get(media.id);
    if (existing) {
      existing.count += 1;
      continue;
    }

    mediaCounts.set(media.id, {
      count: 1,
      title: media.title || "Unknown",
      type: media.media_type || "N/A",
      release_year: media.year ?? undefined,
    });
  }

  return Array.from(mediaCounts.entries())
    .map(([id, data]) => ({
      id,
      title: data.title,
      type: data.type,
      release_year: data.release_year,
      trackingCount: data.count,
    }))
    .sort((a, b) => b.trackingCount - a.trackingCount)
    .slice(0, 10);
};

/**
 * Fetch recent activity from tracker updates
 * SECURITY: Requires admin privileges
 */
export const getRecentActivity = async (): Promise<RecentActivity[]> => {
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  const { data } = await supabase
    .from("tracker_items")
    .select(
      "id, status, created_at, user_id, media:media_id(title, media_type)",
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    data?.map((row) => {
      const media = firstRelation(
        row.media as
          | { title?: string; media_type?: string }
          | Array<{ title?: string; media_type?: string }>
          | null,
      );

      return {
        id: row.id,
        title: media?.title || "Untitled",
        media_type: media?.media_type || "unknown",
        status: row.status,
        created_at: row.created_at,
        from_user_id: row.user_id,
      };
    }) || []
  );
};

// =====================================================
// Compatibility admin list APIs
// =====================================================

export interface BoardWithStatsAdmin {
  id: string;
  name: string;
  owner_id: string;
  is_private: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_display_name?: string;
}

export interface TaskAdmin {
  id: string;
  user_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_display_name?: string;
  board_title?: string;
}

export const getAllBoardsAdmin = async (
  page = 0,
  perPage = 50,
): Promise<{
  boards: BoardWithStatsAdmin[];
  totalPages: number;
}> => {
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  try {
    const { count } = await supabase
      .from("playlists")
      .select("*", { count: "exact", head: true });

    const { data: playlists, error } = await supabase
      .from("playlists")
      .select(
        "id, owner_id, name, is_private, created_at, updated_at, user_profiles!playlists_owner_id_fkey(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (error) throw error;

    const playlistIds = (playlists || []).map((playlist) => playlist.id);
    const { data: itemRows } =
      playlistIds.length > 0
        ? await supabase
            .from("playlist_items")
            .select("playlist_id")
            .in("playlist_id", playlistIds)
        : { data: [] as Array<{ playlist_id: string }> };

    const itemCountMap = new Map<string, number>();
    for (const row of itemRows || []) {
      const key = String(row.playlist_id);
      itemCountMap.set(key, (itemCountMap.get(key) || 0) + 1);
    }

    const boardsWithUserInfo: BoardWithStatsAdmin[] =
      playlists?.map((playlist) => {
        const userProfile = firstRelation(
          playlist.user_profiles as
            | { display_name?: string; email?: string }
            | Array<{ display_name?: string; email?: string }>
            | null
            | undefined,
        );

        return {
          id: playlist.id,
          owner_id: playlist.owner_id,
          name: playlist.name,
          is_private: playlist.is_private,
          item_count: itemCountMap.get(playlist.id) || 0,
          created_at: playlist.created_at,
          updated_at: playlist.updated_at,
          user_email: userProfile?.email,
          user_display_name: userProfile?.display_name,
        };
      }) || [];

    const totalPages = Math.ceil((count || 0) / perPage);

    try {
      await supabase.rpc("log_admin_action", {
        p_action: "view_all_playlists",
        p_target_user_id: null,
        p_details: { page, perPage, totalPlaylists: count || 0 },
      });
    } catch (logError) {
      logger.warn("Failed to log admin action", { error: logError });
    }

    return { boards: boardsWithUserInfo, totalPages };
  } catch (error) {
    logger.error("Failed to fetch all boards for admin", { error });
    throw error;
  }
};

export const getAllTasksAdmin = async (
  page = 0,
  perPage = 100,
): Promise<{
  tasks: TaskAdmin[];
  totalPages: number;
}> => {
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  try {
    const { count } = await supabase
      .from("tracker_items")
      .select("*", { count: "exact", head: true });

    const { data: trackerRows, error } = await supabase
      .from("tracker_items")
      .select(
        "id, user_id, status, created_at, updated_at, media:media_id(title), user_profiles!tracker_items_user_id_fkey(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (error) throw error;

    const tasksWithUserInfo: TaskAdmin[] =
      trackerRows?.map((task) => {
        const media = firstRelation(
          task.media as { title?: string } | Array<{ title?: string }> | null,
        );
        const userProfile = firstRelation(
          task.user_profiles as
            | { display_name?: string; email?: string }
            | Array<{ display_name?: string; email?: string }>
            | null,
        );

        return {
          id: task.id,
          user_id: task.user_id,
          title: media?.title || "Untitled",
          status: task.status,
          created_at: task.created_at,
          updated_at: task.updated_at,
          user_email: userProfile?.email,
          user_display_name: userProfile?.display_name,
          board_title: "Tracker",
        };
      }) || [];

    const totalPages = Math.ceil((count || 0) / perPage);

    try {
      await supabase.rpc("log_admin_action", {
        p_action: "view_all_tracker_items",
        p_target_user_id: null,
        p_details: { page, perPage, totalItems: count || 0 },
      });
    } catch (logError) {
      logger.warn("Failed to log admin action", { error: logError });
    }

    return { tasks: tasksWithUserInfo, totalPages };
  } catch (error) {
    logger.error("Failed to fetch all tracker items for admin", { error });
    throw error;
  }
};
