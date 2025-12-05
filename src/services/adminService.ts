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
      console.warn("Admin operation attempted without authentication");
      return false;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      console.warn(
        `Unauthorized admin operation attempted by user: ${user.id}`
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
  is_admin?: boolean;
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
    .select(
      "user_id, display_name, email, bio, is_admin, created_at, updated_at",
      {
        count: "exact",
      }
    );

  // Apply search filter if there's a search term
  if (searchTerm.trim()) {
    query = query.or(
      `display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`
    );
  }

  // Get total count for pagination
  const { count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  // Fetch paginated results
  const { data: userProfiles } = await query
    .order("created_at", { ascending: false })
    .range(page * perPage, (page + 1) * perPage - 1);

  const users: UserProfile[] =
    userProfiles?.map(
      (profile: {
        user_id: string;
        display_name?: string;
        email?: string;
        bio?: string;
        is_admin?: boolean;
        created_at: string;
        updated_at: string;
      }) => ({
        id: profile.user_id,
        display_name: profile.display_name || "No Name Set",
        email: profile.email,
        bio: profile.bio,
        is_admin: profile.is_admin || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      })
    ) || [];

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
