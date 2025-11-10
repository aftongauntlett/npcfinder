import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";

interface DashboardStats {
  moviesAndTvCount: number;
  moviesWatched: number;
  moviesToWatch: number;
  booksCount: number;
  booksRead: number;
  booksReading: number;
  booksToRead: number;
  musicCount: number;
  gamesCount: number;
  gamesPlayed: number;
  gamesToPlay: number;
  friendsCount: number;
  pendingRecommendations: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get combined movies & TV shows count from user_watchlist
  const { data: watchlistItems, error: watchlistError } = await supabase
    .from("user_watchlist")
    .select("watched")
    .eq("user_id", user.id);

  if (watchlistError) throw watchlistError;

  const moviesAndTvCount = watchlistItems?.length || 0;
  const moviesWatched =
    watchlistItems?.filter((item) => item.watched).length || 0;
  const moviesToWatch = moviesAndTvCount - moviesWatched;

  // Get books count from reading_list with read status
  const { data: bookItems, error: booksError } = await supabase
    .from("reading_list")
    .select("read")
    .eq("user_id", user.id);

  if (booksError) throw booksError;

  const booksCount = bookItems?.length || 0;
  const booksRead = bookItems?.filter((item) => item.read === true).length || 0;
  const booksReading = 0; // reading_list doesn't track "currently reading" status
  const booksToRead =
    bookItems?.filter((item) => item.read === false).length || 0;

  // Get music library count
  const { count: musicCount, error: musicError } = await supabase
    .from("music_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (musicError) throw musicError;

  // Get games count from game_library with played status
  const { data: gameItems, error: gamesError } = await supabase
    .from("game_library")
    .select("played")
    .eq("user_id", user.id);

  if (gamesError) throw gamesError;

  const gamesCount = gameItems?.length || 0;
  const gamesPlayed = gameItems?.filter((item) => item.played).length || 0;
  const gamesToPlay = gamesCount - gamesPlayed;

  // Get friends count - need to count bidirectional connections
  const { data: connections, error: friendsError } = await supabase
    .from("connections")
    .select("user_id, friend_id");

  if (friendsError) throw friendsError;

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

  if (movieRecsError) throw movieRecsError;

  // Get pending book recommendations count (only unopened ones)
  const { count: bookRecsCount, error: bookRecsError } = await supabase
    .from("book_recommendations")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .is("opened_at", null);

  if (bookRecsError) throw bookRecsError;

  const finalStats = {
    moviesAndTvCount: moviesAndTvCount || 0,
    moviesWatched: moviesWatched || 0,
    moviesToWatch: moviesToWatch || 0,
    booksCount: booksCount || 0,
    booksRead: booksRead || 0,
    booksReading: booksReading || 0,
    booksToRead: booksToRead || 0,
    musicCount: musicCount || 0,
    gamesCount: gamesCount || 0,
    gamesPlayed: gamesPlayed || 0,
    gamesToPlay: gamesToPlay || 0,
    friendsCount,
    pendingRecommendations: (movieRecsCount || 0) + (bookRecsCount || 0),
  };

  return finalStats;
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
