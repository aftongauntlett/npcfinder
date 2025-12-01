// TanStack Query Keys
// Centralized query key factory for consistent caching

// UI-level media type groupings (used for routing/tabs and cache keys)
// Note: These differ from DB media_type values (movie/tv/song/album/book/game)
// to support grouped views like "movies-tv" and "music"
type MediaType = "movies-tv" | "music" | "books" | "games";
type RecommendationView =
  | "overview"
  | "queue"
  | "hits"
  | "misses"
  | "sent"
  | "friend";

export const queryKeys = {
  // Recommendations
  recommendations: {
    all: ["recommendations"] as const,
    lists: () => [...queryKeys.recommendations.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.recommendations.lists(), filters] as const,
    fromFriend: (friendId: string, mediaType?: MediaType) =>
      [
        ...queryKeys.recommendations.all,
        "friend",
        friendId,
        mediaType,
      ] as const,
    byMedia: (
      view: RecommendationView,
      friendId: string | undefined,
      mediaType: MediaType
    ) => [...queryKeys.recommendations.all, mediaType, view, friendId] as const,
  },

  // Friends
  friends: {
    all: ["friends"] as const,
    withRecs: (mediaType?: MediaType) =>
      [...queryKeys.friends.all, "with-recs", mediaType] as const,
  },

  // Stats
  stats: {
    all: ["stats"] as const,
    quick: (mediaType?: MediaType) =>
      [...queryKeys.stats.all, "quick", mediaType] as const,
  },

  // User profiles
  profiles: {
    all: ["profiles"] as const,
    detail: (userId: string) => [...queryKeys.profiles.all, userId] as const,
    current: () => [...queryKeys.profiles.all, "current"] as const,
  },

  // Admin
  admin: {
    all: ["admin"] as const,
    stats: () => [...queryKeys.admin.all, "stats"] as const,
    users: (page: number, searchTerm: string) =>
      [...queryKeys.admin.all, "users", page, searchTerm] as const,
    popularMedia: () => [...queryKeys.admin.all, "popular-media"] as const,
    recentActivity: () => [...queryKeys.admin.all, "recent-activity"] as const,
  },

  // Invite codes
  inviteCodes: {
    all: ["invite-codes"] as const,
    list: () => [...queryKeys.inviteCodes.all, "list"] as const,
    stats: () => [...queryKeys.inviteCodes.all, "stats"] as const,
  },

  // Watchlist
  watchlist: {
    all: ["watchlist"] as const,
    list: (userId?: string) =>
      [...queryKeys.watchlist.all, "list", userId] as const,
    item: (id: string) => [...queryKeys.watchlist.all, "item", id] as const,
    byStatus: (watched: boolean, userId?: string) =>
      [...queryKeys.watchlist.all, "by-status", watched, userId] as const,
  },

  // Reviews
  reviews: {
    all: ["reviews"] as const,
    my: (externalId: string, mediaType: string) =>
      [...queryKeys.reviews.all, "my", externalId, mediaType] as const,
    friends: (externalId: string, mediaType: string) =>
      [...queryKeys.reviews.all, "friends", externalId, mediaType] as const,
    byUser: (userId: string) =>
      [...queryKeys.reviews.all, "user", userId] as const,
    byMedia: (externalId: string, mediaType: string) =>
      [...queryKeys.reviews.all, "media", externalId, mediaType] as const,
  },

  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
  },

  // Tasks
  tasks: {
    all: ["tasks"] as const,
    boards: () => [...queryKeys.tasks.all, "boards"] as const,
    board: (boardId: string) =>
      [...queryKeys.tasks.all, "board", boardId] as const,
    boardSections: (boardId: string) =>
      [...queryKeys.tasks.all, "board-sections", boardId] as const,
    boardTasks: (boardId: string | null) =>
      [...queryKeys.tasks.all, "board-tasks", boardId ?? "inbox"] as const,
    task: (taskId: string) => [...queryKeys.tasks.all, "task", taskId] as const,
    todayTasks: (userId?: string) =>
      [...queryKeys.tasks.all, "today", userId] as const,
    archivedTasks: (userId?: string) =>
      [...queryKeys.tasks.all, "archived", userId] as const,
    tasksByStatus: (status: string, userId?: string) =>
      [...queryKeys.tasks.all, "by-status", status, userId] as const,
  },
};
