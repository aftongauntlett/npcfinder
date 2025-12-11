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

  // Batch 1: Fetch all media-related data in parallel
  const [
    watchlistResult,
    booksResult,
    musicResult,
    gamesResult,
    connectionsResult,
    movieRecsResult,
    bookRecsResult,
  ] = await Promise.all([
    supabase.from("user_watchlist").select("watched").eq("user_id", user.id),
    supabase.from("reading_list").select("read").eq("user_id", user.id),
    supabase
      .from("music_library")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("game_library").select("played").eq("user_id", user.id),
    supabase.from("connections").select("user_id, friend_id"),
    supabase
      .from("movie_recommendations")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .is("opened_at", null),
    supabase
      .from("book_recommendations")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .is("opened_at", null),
  ]);

  // Check for errors in media queries
  if (watchlistResult.error) throw watchlistResult.error;
  if (booksResult.error) throw booksResult.error;
  if (musicResult.error) throw musicResult.error;
  if (gamesResult.error) throw gamesResult.error;
  if (connectionsResult.error) throw connectionsResult.error;
  if (movieRecsResult.error) throw movieRecsResult.error;
  if (bookRecsResult.error) throw bookRecsResult.error;

  // Process media data
  const watchlistItems = watchlistResult.data;
  const moviesAndTvCount = watchlistItems?.length || 0;
  const moviesWatched =
    watchlistItems?.filter((item) => item.watched).length || 0;
  const moviesToWatch = moviesAndTvCount - moviesWatched;

  const bookItems = booksResult.data;
  const booksCount = bookItems?.length || 0;
  const booksRead = bookItems?.filter((item) => item.read === true).length || 0;
  const booksReading = 0; // reading_list doesn't track "currently reading" status
  const booksToRead =
    bookItems?.filter((item) => item.read === false).length || 0;

  const musicCount = musicResult.count || 0;

  const gameItems = gamesResult.data;
  const gamesCount = gameItems?.length || 0;
  const gamesPlayed = gameItems?.filter((item) => item.played).length || 0;
  const gamesToPlay = gamesCount - gamesPlayed;

  const connections = connectionsResult.data;
  const friendsCount =
    connections?.filter(
      (conn) => conn.user_id === user.id || conn.friend_id === user.id
    ).length || 0;

  const movieRecsCount = movieRecsResult.count || 0;
  const bookRecsCount = bookRecsResult.count || 0;

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
    pendingRecommendations: movieRecsCount + bookRecsCount,
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
