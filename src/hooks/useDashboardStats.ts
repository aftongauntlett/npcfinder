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
  // Task and board statistics
  totalBoards: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
  upcomingTasks: number;
  sharedBoardsCount: number;
  jobTasksCount: number;
  recipeTasksCount: number;
  groceryTasksCount: number;
  todoTasksCount: number;
  kanbanTasksCount: number;
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

  // Batch 2: Fetch task boards and parallel task counts
  // Note: This query fetches only boards owned by the user.
  // Shared boards are counted separately via sharedBoardsCount.
  // The aggregate counts (totalBoards, totalTasks, completedTasks) include owned boards only.
  const { data: taskBoards, error: boardsError } = await supabase
    .from("task_boards_with_stats")
    .select("*")
    .eq("user_id", user.id);

  if (boardsError) throw boardsError;

  const totalBoards = taskBoards?.length || 0;
  const totalTasks =
    taskBoards?.reduce((sum, board) => sum + (board.total_tasks || 0), 0) || 0;
  const completedTasks =
    taskBoards?.reduce((sum, board) => sum + (board.completed_tasks || 0), 0) ||
    0;

  // Prepare date ranges for task queries
  // Note: due_date is a DATE column, not TIMESTAMP, so use YYYY-MM-DD strings
  const todayString = new Date().toISOString().split("T")[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekString = nextWeek.toISOString().split("T")[0];

  // Prepare board IDs for template-type queries
  const jobBoardIds =
    taskBoards
      ?.filter((b) => b.template_type === "job_tracker")
      .map((b) => b.id) || [];
  const recipeBoardIds =
    taskBoards?.filter((b) => b.template_type === "recipe").map((b) => b.id) ||
    [];
  const groceryBoardIds =
    taskBoards?.filter((b) => b.template_type === "grocery").map((b) => b.id) ||
    [];
  const todoBoardIds =
    taskBoards
      ?.filter((b) => b.template_type === "markdown")
      .map((b) => b.id) || [];
  const kanbanBoardIds =
    taskBoards?.filter((b) => b.template_type === "kanban").map((b) => b.id) ||
    [];

  // Batch 3: Fetch all task-related counts in parallel
  const [
    overdueResult,
    todayResult,
    upcomingResult,
    sharedResult,
    jobResult,
    recipeResult,
    groceryResult,
    todoResult,
    kanbanResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["todo", "in_progress"])
      .lt("due_date", todayString),
    // Aligned with tasksService.getTodayTasks - uses exact date match for today
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["todo", "in_progress"])
      .eq("due_date", todayString),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["todo", "in_progress"])
      .gt("due_date", todayString)
      .lte("due_date", nextWeekString),
    supabase
      .from("board_shares")
      .select("id", { count: "exact", head: true })
      .eq("shared_with_user_id", user.id),
    jobBoardIds.length > 0
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "archived")
          .in("board_id", jobBoardIds)
      : Promise.resolve({ count: 0, error: null }),
    recipeBoardIds.length > 0
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "archived")
          .in("board_id", recipeBoardIds)
      : Promise.resolve({ count: 0, error: null }),
    groceryBoardIds.length > 0
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "archived")
          .in("board_id", groceryBoardIds)
      : Promise.resolve({ count: 0, error: null }),
    todoBoardIds.length > 0
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "archived")
          .in("board_id", todoBoardIds)
      : Promise.resolve({ count: 0, error: null }),
    kanbanBoardIds.length > 0
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "archived")
          .in("board_id", kanbanBoardIds)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  // Check for errors in task queries
  if (overdueResult.error) throw overdueResult.error;
  if (todayResult.error) throw todayResult.error;
  if (upcomingResult.error) throw upcomingResult.error;
  // Gracefully handle board_shares errors (table might not exist or RLS not configured)
  // Don't throw - just set count to 0
  if (sharedResult.error) {
    console.warn(
      "board_shares query failed (table may not exist yet):",
      sharedResult.error
    );
  }
  if (jobResult.error) throw jobResult.error;
  if (recipeResult.error) throw recipeResult.error;
  if (groceryResult.error) throw groceryResult.error;
  if (todoResult.error) throw todoResult.error;
  if (kanbanResult.error) throw kanbanResult.error;

  // Extract counts
  const overdueCount = overdueResult.count || 0;
  const todayCount = todayResult.count || 0;
  const upcomingCount = upcomingResult.count || 0;
  const sharedCount = sharedResult.error ? 0 : sharedResult.count || 0;
  const jobCount = jobResult.count || 0;
  const recipeCount = recipeResult.count || 0;
  const groceryCount = groceryResult.count || 0;
  const todoCount = todoResult.count || 0;
  const kanbanCount = kanbanResult.count || 0;

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
    // Task and board statistics
    totalBoards,
    totalTasks,
    completedTasks,
    overdueTasks: overdueCount,
    todayTasks: todayCount,
    upcomingTasks: upcomingCount,
    sharedBoardsCount: sharedCount,
    jobTasksCount: jobCount,
    recipeTasksCount: recipeCount,
    groceryTasksCount: groceryCount,
    todoTasksCount: todoCount,
    kanbanTasksCount: kanbanCount,
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
