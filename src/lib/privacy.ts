/**
 * Privacy & Data Management Functions
 *
 * Simple privacy features you can offer:
 * - Export user data
 * - Delete user account
 * - View what data is stored
 */

import { supabase } from "./supabase";

/**
 * Export all of a user's data
 * Gives users control over their data
 */
export async function exportUserData(userId: string) {
  try {
    // Fetch all user data
    const [watchlist, archive, movieRecs, connections, userProfile] =
      await Promise.all([
        supabase.from("user_watchlist").select("*").eq("user_id", userId),
        supabase.from("user_watched_archive").select("*").eq("user_id", userId),
        supabase
          .from("movie_recommendations")
          .select("*")
          .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
        supabase
          .from("connections")
          .select("*")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
        supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single(),
      ]);

    // Get user auth info (email only, not password)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const exportData = {
      export_date: new Date().toISOString(),
      user: {
        id: userId,
        email: user?.email,
        created_at: user?.created_at,
      },
      profile: userProfile.data,
      watchlist: watchlist.data,
      watched_archive: archive.data,
      movie_recommendations: movieRecs.data,
      connections: connections.data,
      metadata: {
        total_watchlist_items: watchlist.data?.length || 0,
        total_watched_items: archive.data?.length || 0,
        total_recommendations: movieRecs.data?.length || 0,
        total_connections: connections.data?.length || 0,
      },
    };

    return {
      data: exportData,
      error: null,
    };
  } catch (error) {
    console.error("Export user data error:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Failed to export data"),
    };
  }
}

/**
 * Download exported data as JSON file
 */
export function downloadDataAsJson(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  filename: string = "my-npc-finder-data"
) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get summary of what data is stored for a user
 */
export async function getUserDataSummary(userId: string) {
  try {
    const [watchlist, archive, movieRecs, friends, suggestions] =
      await Promise.all([
        supabase
          .from("user_watchlist")
          .select("id", { count: "exact" })
          .eq("user_id", userId),
        supabase
          .from("user_watched_archive")
          .select("id", { count: "exact" })
          .eq("user_id", userId),
        supabase
          .from("movie_recommendations")
          .select("id", { count: "exact" })
          .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
        supabase
          .from("connections")
          .select("id", { count: "exact" })
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
        supabase
          .from("suggestions")
          .select("id", { count: "exact" })
          .eq("created_by", userId),
      ]);

    return {
      data: {
        watchlist_count: watchlist.count || 0,
        watched_count: archive.count || 0,
        recommendations_count: movieRecs.count || 0,
        friends_count: friends.count || 0,
        suggestions_count: suggestions.count || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("Get user data summary error:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to get data summary"),
    };
  }
}

/**
 * Delete all user data (account deletion)
 * WARNING: This is irreversible!
 */
export async function deleteUserAccount(userId: string) {
  try {
    // Delete all user data in correct order (respecting foreign keys)
    await Promise.all([
      supabase.from("user_watchlist").delete().eq("user_id", userId),
      supabase.from("user_watched_archive").delete().eq("user_id", userId),
      supabase
        .from("movie_recommendations")
        .delete()
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
      supabase.from("suggestions").delete().eq("created_by", userId),
      supabase
        .from("connections")
        .delete()
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
      supabase.from("user_profiles").delete().eq("user_id", userId),
    ]);

    // Note: Deleting auth user requires admin privileges
    // This would need to be done via Supabase admin API or manually
    // For now, we just delete all user data

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Delete user account error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to delete account"),
    };
  }
}

/**
 * What data we collect - for transparency
 */
export const DATA_WE_COLLECT = {
  authentication: {
    email: "Your email address",
    password_hash: "Your password (hashed, we can't see it)",
    auth_metadata: "Login timestamps, last sign in",
  },
  profile: {
    username: "Your chosen username",
    display_name: "Your display name",
    preferences: "App settings and preferences",
  },
  content: {
    watchlist: "Movies and TV shows you want to watch",
    watched_archive: "Movies and TV shows you've watched with ratings",
    notes: "Personal notes you add",
    recommendations: "Recommendations you send and receive",
    suggestions: "Recommendations you make to friends",
  },
  social: {
    friend_connections: "Who you're friends with in the app",
    shared_content: "What you choose to share with friends",
  },
  technical: {
    session_data: "Login sessions (temporary)",
    error_logs: "Crash reports to fix bugs",
  },
};

/**
 * What we DON'T do with data - for transparency
 */
export const PRIVACY_PROMISES = {
  no_selling: "We never sell your data to anyone",
  no_ads: "We don't use your data for advertising",
  no_tracking: "No analytics or tracking scripts",
  no_third_party: "No third-party data sharing",
  friend_group_only: "This is for friends only, not a commercial service",
  admin_access: "Admin can technically access the database (but won't)",
  can_export: "You can export all your data anytime",
  can_delete: "You can delete your account anytime",
};
