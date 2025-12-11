// Admin Service - Supabase Implementation
// SECURITY: AdminContext gates route access, RLS enforces backend protection

import { supabase } from "../lib/supabase";
import { logger } from "@/lib/logger";
import type { BoardWithStats } from "./tasksService.types";

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
        { role: profile?.role }
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Failed to verify admin access", { error });
    return false;
  }
};

export interface AdminStats {
  totalUsers: number;
  totalMediaItems: number;
  totalRatings: number;
  totalInviteCodes: number; // Admin-specific: total invite codes created
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

  // Run all independent count queries concurrently
  const [
    { count: inviteCodesCount },
    { count: watchlistCount },
    { count: watchedCount },
    { count: userCount },
    { count: weekUsers },
    { count: monthUsers },
    { data: recentWatchlist },
    { data: recentArchive },
  ] = await Promise.all([
    supabase.from("invite_codes").select("*", { count: "exact", head: true }),
    supabase.from("user_watchlist").select("*", { count: "exact", head: true }),
    supabase
      .from("user_watched_archive")
      .select("*", { count: "exact", head: true }),
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
      .from("user_watchlist")
      .select("user_id")
      .gte("added_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("user_watched_archive")
      .select("user_id")
      .gte("watched_at", thirtyDaysAgo.toISOString()),
  ]);

  // Compute unique active users from combined datasets
  const activeUserIds = new Set([
    ...(recentWatchlist?.map((item) => item.user_id) || []),
    ...(recentArchive?.map((item) => item.user_id) || []),
  ]);

  const uniqueActiveUsers = activeUserIds.size;

  // Calculate average ratings per user (watched items have ratings)
  const avgRatings =
    userCount && userCount > 0
      ? Math.round((watchedCount || 0) / userCount)
      : 0;

  return {
    totalUsers: userCount || 0,
    totalMediaItems: (watchlistCount || 0) + (watchedCount || 0),
    totalRatings: watchedCount || 0,
    totalInviteCodes: inviteCodesCount || 0,
    newUsersThisWeek: weekUsers || 0,
    newUsersThisMonth: monthUsers || 0,
    activeUsers: uniqueActiveUsers,
    avgRatingsPerUser: avgRatings,
  };
};

/**
 * Fetch users with pagination and search
 * SECURITY: Requires admin privileges
 */
export const getUsers = async (
  page: number,
  perPage: number,
  searchTerm: string = ""
): Promise<{ users: UserProfile[]; totalPages: number }> => {
  // Verify admin access
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  let query = supabase
    .from("user_profiles")
    .select("user_id, display_name, email, bio, role, created_at, updated_at", {
      count: "exact",
    });

  // Apply search filter if there's a search term
  if (searchTerm.trim()) {
    query = query.or(
      `display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`
    );
  }

  // Get total count for pagination
  const { count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  // Fetch all results for proper sorting (we'll sort in memory)
  // Note: We fetch all matching results, then sort by role, then paginate
  const { data: allUserProfiles } = await query.order("created_at", {
    ascending: false,
  });

  const allUsers: UserProfile[] =
    allUserProfiles?.map(
      (profile: {
        user_id: string;
        display_name?: string;
        email?: string;
        bio?: string;
        role?: "user" | "admin" | "super_admin";
        created_at: string;
        updated_at: string;
      }) => ({
        id: profile.user_id,
        display_name: profile.display_name || "No Name Set",
        email: profile.email,
        bio: profile.bio,
        role: profile.role || "user",
        is_admin: ["admin", "super_admin"].includes(profile.role || "user"),
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      })
    ) || [];

  // Sort: super_admin first, then admin, then user
  const roleOrder = { super_admin: 0, admin: 1, user: 2 };
  allUsers.sort((a, b) => {
    const aOrder = roleOrder[a.role] ?? 3;
    const bOrder = roleOrder[b.role] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Within same role, sort by created_at (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Paginate the sorted results
  const startIdx = page * perPage;
  const endIdx = (page + 1) * perPage;
  const users = allUsers.slice(startIdx, endIdx);

  // Log admin action for audit trail (L2)
  try {
    await supabase.rpc("log_admin_action", {
      p_action: "view_user_list",
      p_target_user_id: null,
      p_details: { page, perPage, searchTerm, totalUsers: count || 0 },
    });
  } catch (error) {
    // Don't fail the operation if logging fails
    logger.warn("Failed to log admin action", { error });
  }

  return { users, totalPages };
};

/**
 * Fetch popular media (most tracked items)
 * SECURITY: Requires admin privileges
 */
export const getPopularMedia = async (): Promise<PopularMedia[]> => {
  // Verify admin access
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  // Fetch watchlist data
  const { data: watchlistData } = await supabase
    .from("user_watchlist")
    .select("external_id, title, media_type");

  // Fetch archive data
  const { data: archiveData } = await supabase
    .from("user_watched_archive")
    .select("external_id, title, media_type");

  // Combine and count occurrences
  const allMedia = [...(watchlistData || []), ...(archiveData || [])];
  const mediaCounts: Record<
    string,
    { count: number; title: string; type: string }
  > = {};

  allMedia.forEach((item) => {
    if (item.external_id) {
      if (!mediaCounts[item.external_id]) {
        mediaCounts[item.external_id] = {
          count: 0,
          title: item.title || "Unknown",
          type: item.media_type || "N/A",
        };
      }
      mediaCounts[item.external_id].count++;
    }
  });

  // Get top 10
  const topMedia = Object.entries(mediaCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([id, data]) => ({
      id,
      title: data.title,
      type: data.type,
      trackingCount: data.count,
    }));

  return topMedia;
};

/**
 * Fetch recent activity (movie recommendations)
 * SECURITY: Requires admin privileges
 */
export const getRecentActivity = async (): Promise<RecentActivity[]> => {
  // Verify admin access
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  const { data: recentRecs } = await supabase
    .from("movie_recommendations")
    .select(
      "id, title, media_type, status, created_at, from_user_id, to_user_id"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return recentRecs || [];
};

// =====================================================
// ADMIN TASK OPERATIONS
// =====================================================

/**
 * Admin-specific type for board with user information
 * Extends BoardWithStats with admin-only fields
 */
export interface BoardWithStatsAdmin extends BoardWithStats {
  user_email?: string;
  user_display_name?: string;
}

/**
 * Admin-specific type for task with user information
 */
export interface TaskAdmin {
  id: string;
  user_id: string;
  board_id?: string;
  section_id?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  // Admin-specific fields
  user_email?: string;
  user_display_name?: string;
  board_title?: string;
}

/**
 * Fetch all boards from all users (admin-only)
 * SECURITY: Requires admin privileges. This intentionally bypasses user filtering.
 * USAGE: Only for admin panel views, NOT for regular app usage.
 */
export const getAllBoardsAdmin = async (
  page = 0,
  perPage = 50
): Promise<{
  boards: BoardWithStatsAdmin[];
  totalPages: number;
}> => {
  // Verify admin access
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  try {
    // Get total count
    const { count } = await supabase
      .from("task_boards_with_stats")
      .select("*", { count: "exact", head: true });

    // Fetch boards with user information
    const { data: boards, error } = await supabase
      .from("task_boards_with_stats")
      .select(
        `
        *,
        user_profiles!task_boards_user_id_fkey (
          display_name,
          email
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (error) throw error;

    const boardsWithUserInfo: BoardWithStatsAdmin[] =
      boards?.map(
        (board: BoardWithStats & {
          user_profiles?: { display_name?: string; email?: string };
        }) => ({
          ...board,
          user_email: board.user_profiles?.email,
          user_display_name: board.user_profiles?.display_name,
        })
      ) || [];

    const totalPages = Math.ceil((count || 0) / perPage);

    // Log admin action for audit trail
    try {
      await supabase.rpc("log_admin_action", {
        p_action: "view_all_boards",
        p_target_user_id: null,
        p_details: { page, perPage, totalBoards: count || 0 },
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

/**
 * Fetch all tasks from all users (admin-only)
 * SECURITY: Requires admin privileges. This intentionally bypasses user filtering.
 * USAGE: Only for admin panel views, NOT for regular app usage.
 */
export const getAllTasksAdmin = async (
  page = 0,
  perPage = 100
): Promise<{
  tasks: TaskAdmin[];
  totalPages: number;
}> => {
  // Verify admin access
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  try {
    // Get total count
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true });

    // Fetch tasks with user and board information
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        user_profiles!tasks_user_id_fkey (
          display_name,
          email
        ),
        task_boards!tasks_board_id_fkey (
          title
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (error) throw error;

    const tasksWithUserInfo: TaskAdmin[] =
      tasks?.map(
        (task: {
          id: string;
          user_id: string;
          board_id?: string;
          section_id?: string;
          title: string;
          description?: string;
          status: string;
          priority?: string;
          due_date?: string;
          created_at: string;
          updated_at: string;
          user_profiles?: { display_name?: string; email?: string };
          task_boards?: { title?: string };
        }) => ({
          id: task.id,
          user_id: task.user_id,
          board_id: task.board_id,
          section_id: task.section_id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          created_at: task.created_at,
          updated_at: task.updated_at,
          user_email: task.user_profiles?.email,
          user_display_name: task.user_profiles?.display_name,
          board_title: task.task_boards?.title,
        })
      ) || [];

    const totalPages = Math.ceil((count || 0) / perPage);

    // Log admin action for audit trail
    try {
      await supabase.rpc("log_admin_action", {
        p_action: "view_all_tasks",
        p_target_user_id: null,
        p_details: { page, perPage, totalTasks: count || 0 },
      });
    } catch (logError) {
      logger.warn("Failed to log admin action", { error: logError });
    }

    return { tasks: tasksWithUserInfo, totalPages };
  } catch (error) {
    logger.error("Failed to fetch all tasks for admin", { error });
    throw error;
  }
};
