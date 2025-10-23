import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";

interface DashboardStats {
  moviesAndTvCount: number;
  friendsCount: number;
  pendingRecommendations: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get combined movies & TV shows count from user_watchlist
  const { count: moviesAndTvCount, error: watchlistError } = await supabase
    .from("user_watchlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (watchlistError) {
    console.error("Watchlist error:", watchlistError);
    throw watchlistError;
  }

  // Get friends count - need to count bidirectional connections
  const { data: connections, error: friendsError } = await supabase
    .from("connections")
    .select("user_id, friend_id");

  if (friendsError) {
    console.error("Connections error:", friendsError);
    throw friendsError;
  }

  // Count connections where current user is involved
  const friendsCount =
    connections?.filter(
      (conn) => conn.user_id === user.id || conn.friend_id === user.id
    ).length || 0;

  // Get pending movie/TV recommendations count (only unopened ones)
  const { count: movieRecsCount, error: movieRecsError } = await supabase
    .from("movie_recommendations")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .is("opened_at", null);

  if (movieRecsError) {
    console.error("Movie recs error:", movieRecsError);
    throw movieRecsError;
  }

  return {
    moviesAndTvCount: moviesAndTvCount || 0,
    friendsCount,
    pendingRecommendations: movieRecsCount || 0,
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 30, // 30 seconds (reduced from 5 minutes)
    gcTime: 1000 * 60, // 1 minute
    retry: 1, // Only retry once on failure
  });
}
