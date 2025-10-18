/**
 * TanStack Query Keys
 * Centralized query key factory for consistent caching
 */

export const queryKeys = {
  // Recommendations
  recommendations: {
    all: ["recommendations"] as const,
    lists: () => [...queryKeys.recommendations.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.recommendations.lists(), filters] as const,
    fromFriend: (friendId: string, mediaType?: string) =>
      [
        ...queryKeys.recommendations.all,
        "friend",
        friendId,
        mediaType,
      ] as const,
  },

  // Friends
  friends: {
    all: ["friends"] as const,
    withRecs: (mediaType?: string) =>
      [...queryKeys.friends.all, "with-recs", mediaType] as const,
  },

  // Stats
  stats: {
    all: ["stats"] as const,
    quick: (mediaType?: string) =>
      [...queryKeys.stats.all, "quick", mediaType] as const,
  },

  // User profiles
  profiles: {
    all: ["profiles"] as const,
    detail: (userId: string) => [...queryKeys.profiles.all, userId] as const,
    current: () => [...queryKeys.profiles.all, "current"] as const,
  },

  // Suggestions
  suggestions: {
    all: ["suggestions"] as const,
    byStatus: (status: string) =>
      [...queryKeys.suggestions.all, "by-status", status] as const,
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
};
