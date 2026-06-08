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
type CollectionDomain = "movies-tv" | "books" | "games" | "music" | "mixed";

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
      mediaType: MediaType,
    ) => [...queryKeys.recommendations.all, mediaType, view, friendId] as const,
  },

  // Friends
  friends: {
    all: ["friends"] as const,
    withRecs: (mediaType?: MediaType) =>
      [...queryKeys.friends.all, "with-recs", mediaType] as const,
    directory: (
      query: string,
      page: number,
      pageSize: number,
      excludeUserId?: string,
    ) =>
      [
        ...queryKeys.friends.all,
        "directory",
        query,
        page,
        pageSize,
        excludeUserId ?? null,
      ] as const,
    tags: () => [...queryKeys.friends.all, "tags"] as const,
    tagMembers: () => [...queryKeys.friends.all, "tag-members"] as const,
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
    byUsername: (username: string) =>
      [...queryKeys.profiles.all, "username", username] as const,
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
    details: (externalId: string, mediaType: string) =>
      [...queryKeys.watchlist.all, "details", externalId, mediaType] as const,
    detailsBatch: (externalIds: string[]) =>
      [
        ...queryKeys.watchlist.all,
        "details-batch",
        externalIds.sort().join(","),
      ] as const,
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

  // Collections
  collections: {
    all: ["collections"] as const,
    allAccessible: () => [...queryKeys.collections.all, "accessible"] as const,
    lists: (domain: CollectionDomain) =>
      [...queryKeys.collections.all, "lists", domain] as const,
    detail: (collectionId: string) =>
      [...queryKeys.collections.all, "detail", collectionId] as const,
    items: (collectionId: string) =>
      [...queryKeys.collections.all, "items", collectionId] as const,
    members: (collectionId: string) =>
      [...queryKeys.collections.all, "members", collectionId] as const,
    myRole: (collectionId: string, userId?: string) =>
      [...queryKeys.collections.all, "my-role", collectionId, userId] as const,
  },

  // Tracker
  tracker: {
    all: ["tracker"] as const,
    items: (filter: "active" | "done") =>
      [...queryKeys.tracker.all, "items", filter] as const,
    stats: () => [...queryKeys.tracker.all, "stats"] as const,
  },

  // Cached media details (TMDB/RAWG/Google Books "more details" lookups)
  mediaDetails: {
    all: ["mediaDetails"] as const,
    byExternalId: (
      mediaType: string | undefined,
      externalId: string | undefined,
    ) => [...queryKeys.mediaDetails.all, mediaType, externalId] as const,
  },

  // Playlists
  playlists: {
    all: ["playlists"] as const,
    lists: () => [...queryKeys.playlists.all, "lists"] as const,
    detail: (playlistId: string) =>
      [...queryKeys.playlists.all, "detail", playlistId] as const,
    items: (playlistId: string) =>
      [...queryKeys.playlists.all, "items", playlistId] as const,
    shares: (playlistId: string) =>
      [...queryKeys.playlists.all, "shares", playlistId] as const,
  },

  // Tasks
  // Note: All task queries must start with queryKeys.tasks.all prefix
  // to ensure proper invalidation when using queryClient.invalidateQueries
  tasks: {
    all: ["tasks"] as const,
    boards: (userId?: string) =>
      [...queryKeys.tasks.all, "boards", userId] as const,
    board: (boardId: string) =>
      [...queryKeys.tasks.all, "board", boardId] as const,
    boardSections: (boardId: string) =>
      [...queryKeys.tasks.all, "board-sections", boardId] as const,
    boardTasks: (boardId: string | null) =>
      [...queryKeys.tasks.all, "board-tasks", boardId ?? "inbox"] as const,
    task: (taskId: string) => [...queryKeys.tasks.all, "task", taskId] as const,
    todayTasks: (userId?: string) =>
      [...queryKeys.tasks.all, "today", userId] as const,
    upcomingTasks: (userId?: string) =>
      [...queryKeys.tasks.all, "upcoming", userId] as const,
    archivedTasks: (userId?: string) =>
      [...queryKeys.tasks.all, "archived", userId] as const,
    tasksByStatus: (status: string, userId?: string) =>
      [...queryKeys.tasks.all, "by-status", status, userId] as const,
    byTemplate: (templateType: string, boardIds: string[]) =>
      [...queryKeys.tasks.all, "by-template", templateType, boardIds] as const,
    activeTimers: () => [...queryKeys.tasks.all, "active-timers"] as const,
    upcomingReminders: (daysAhead: number) =>
      [...queryKeys.tasks.all, "upcoming-reminders", daysAhead] as const,
    boardShares: (boardId: string) =>
      [...queryKeys.tasks.all, "board-shares", boardId] as const,
    sharedBoards: (userId?: string) =>
      [...queryKeys.tasks.all, "shared-boards", userId] as const,
  },

  // Singleton boards for global collections
  singletonBoard: (templateType: string) =>
    ["singleton-board", templateType] as const,

  // Reading List
  readingList: {
    all: ["reading-list"] as const,
    list: (userId?: string) => [...queryKeys.readingList.all, userId] as const,
  },

  // Game Library
  gameLibrary: {
    all: ["game-library"] as const,
    list: (userId?: string) => [...queryKeys.gameLibrary.all, userId] as const,
    inLibrary: (externalId: string) => ["game-in-library", externalId] as const,
  },

  // Music Library
  musicLibrary: {
    all: ["musicLibrary"] as const,
    list: (userId?: string) => [...queryKeys.musicLibrary.all, userId] as const,
    stats: () => ["musicLibraryStats"] as const,
  },
};
