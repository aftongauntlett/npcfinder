/**
 * Admin Service - Real Supabase Implementation
 * Handles admin-related data fetching and operations
 */

import { supabase } from "../lib/supabase";

export interface AdminStats {
  totalUsers: number;
  totalMediaItems: number;
  totalRatings: number;
  totalConnections: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers: number;
  avgRatingsPerUser: number;
}

export interface UserProfile {
  id: string;
  display_name: string;
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

/**
 * Fetch admin statistics
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch connections count
  const { count: connectionsCount } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true });

  // Count watchlist items
  const { count: watchlistCount } = await supabase
    .from("user_watchlist")
    .select("*", { count: "exact", head: true });

  // Count watched archive items (these have ratings)
  const { count: watchedCount } = await supabase
    .from("user_watched_archive")
    .select("*", { count: "exact", head: true });

  // Get total users from user_profiles table
  const { count: userCount } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true });

  // Get new users this week
  const { count: weekUsers } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneWeekAgo.toISOString());

  // Get new users this month
  const { count: monthUsers } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneMonthAgo.toISOString());

  // Get active users (users who have added items in last 30 days)
  const { data: recentWatchlist } = await supabase
    .from("user_watchlist")
    .select("user_id")
    .gte("added_at", thirtyDaysAgo.toISOString());

  const { data: recentArchive } = await supabase
    .from("user_watched_archive")
    .select("user_id")
    .gte("watched_at", thirtyDaysAgo.toISOString());

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
    totalConnections: connectionsCount || 0,
    newUsersThisWeek: weekUsers || 0,
    newUsersThisMonth: monthUsers || 0,
    activeUsers: uniqueActiveUsers,
    avgRatingsPerUser: avgRatings,
  };
};

/**
 * Fetch users with pagination and search
 */
export const getUsers = async (
  page: number,
  perPage: number,
  searchTerm: string = ""
): Promise<{ users: UserProfile[]; totalPages: number }> => {
  let query = supabase
    .from("user_profiles")
    .select("user_id, display_name, bio, is_admin, created_at, updated_at", {
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

  // Fetch paginated results
  const { data: userProfiles } = await query
    .order("created_at", { ascending: false })
    .range(page * perPage, (page + 1) * perPage - 1);

  const users: UserProfile[] =
    userProfiles?.map(
      (profile: {
        user_id: string;
        display_name?: string;
        bio?: string;
        is_admin?: boolean;
        created_at: string;
        updated_at: string;
      }) => ({
        id: profile.user_id,
        display_name: profile.display_name || "No Name Set",
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
 */
export const getPopularMedia = async (): Promise<PopularMedia[]> => {
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
 */
export const getRecentActivity = async (): Promise<RecentActivity[]> => {
  const { data: recentRecs } = await supabase
    .from("movie_recommendations")
    .select(
      "id, title, media_type, status, created_at, from_user_id, to_user_id"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return recentRecs || [];
};
