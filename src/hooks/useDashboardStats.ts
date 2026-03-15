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

interface CollectionMediaCounts {
  moviesAndTv: number;
  books: number;
  music: number;
  games: number;
}

async function fetchCollectionsMediaCounts(): Promise<CollectionMediaCounts> {
  const { data: items, error: itemsError } = await supabase
    .from("media_list_items")
    .select("media_type");

  if (itemsError) throw itemsError;

  let moviesAndTv = 0;
  let books = 0;
  let music = 0;
  let games = 0;

  (items || []).forEach((item) => {
    if (item.media_type === "movie" || item.media_type === "tv") {
      moviesAndTv += 1;
      return;
    }

    if (item.media_type === "book") {
      books += 1;
      return;
    }

    if (item.media_type === "game") {
      games += 1;
      return;
    }

    if (
      item.media_type === "song" ||
      item.media_type === "album" ||
      item.media_type === "playlist"
    ) {
      music += 1;
    }
  });

  return { moviesAndTv, books, music, games };
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
    musicRecsResult,
    gameRecsResult,
    collectionCounts,
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
    supabase
      .from("music_recommendations")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .is("opened_at", null),
    supabase
      .from("game_recommendations")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .is("opened_at", null),
    fetchCollectionsMediaCounts(),
  ]);

  // Check for errors in media queries
  if (watchlistResult.error) throw watchlistResult.error;
  if (booksResult.error) throw booksResult.error;
  if (musicResult.error) throw musicResult.error;
  if (gamesResult.error) throw gamesResult.error;
  if (connectionsResult.error) throw connectionsResult.error;
  if (movieRecsResult.error) throw movieRecsResult.error;
  if (bookRecsResult.error) throw bookRecsResult.error;
  if (musicRecsResult.error) throw musicRecsResult.error;
  if (gameRecsResult.error) throw gameRecsResult.error;

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
      (conn) => conn.user_id === user.id || conn.friend_id === user.id,
    ).length || 0;

  const movieRecsCount = movieRecsResult.count || 0;
  const bookRecsCount = bookRecsResult.count || 0;
  const musicRecsCount = musicRecsResult.count || 0;
  const gameRecsCount = gameRecsResult.count || 0;

  const finalStats = {
    moviesAndTvCount: collectionCounts.moviesAndTv || moviesAndTvCount || 0,
    moviesWatched: collectionCounts.moviesAndTv || moviesWatched || 0,
    moviesToWatch: moviesToWatch || 0,
    booksCount: collectionCounts.books || booksCount || 0,
    booksRead: collectionCounts.books || booksRead || 0,
    booksReading: booksReading || 0,
    booksToRead: booksToRead || 0,
    musicCount: collectionCounts.music || musicCount || 0,
    gamesCount: collectionCounts.games || gamesCount || 0,
    gamesPlayed: collectionCounts.games || gamesPlayed || 0,
    gamesToPlay: gamesToPlay || 0,
    friendsCount,
    pendingRecommendations:
      movieRecsCount + bookRecsCount + musicRecsCount + gameRecsCount,
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
