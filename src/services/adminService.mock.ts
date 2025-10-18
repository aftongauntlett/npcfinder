/**
 * Admin Service - Mock Implementation
 * Provides mock admin data for local development
 */

import {
  AdminStats,
  UserProfile,
  PopularMedia,
  RecentActivity,
} from "./adminService";
import { mockUsers } from "../data/mockData";

/**
 * Generate mock admin statistics
 */
export const getAdminStats = (): Promise<AdminStats> => {
  console.log("🎭 [MOCK] Getting admin stats");

  return Promise.resolve({
    totalUsers: mockUsers.length,
    totalMediaItems: 150,
    totalRatings: 85,
    totalConnections: 12,
    newUsersThisWeek: 2,
    newUsersThisMonth: 5,
    activeUsers: mockUsers.length - 1,
    avgRatingsPerUser: 15,
  });
};

/**
 * Get mock users with pagination and search
 */
export const getUsers = (
  page: number,
  perPage: number,
  searchTerm: string = ""
): Promise<{ users: UserProfile[]; totalPages: number }> => {
  console.log("🎭 [MOCK] Getting users - page:", page, "search:", searchTerm);

  // Filter users by search term
  let filteredUsers = mockUsers;
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    filteredUsers = mockUsers.filter(
      (user) =>
        user.display_name.toLowerCase().includes(search) ||
        (user.email && user.email.toLowerCase().includes(search))
    );
  }

  // Apply pagination
  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const start = page * perPage;
  const end = start + perPage;
  const paginatedUsers = filteredUsers.slice(start, end);

  // Map to UserProfile format
  const users: UserProfile[] = paginatedUsers.map((user) => ({
    id: user.user_id,
    display_name: user.display_name,
    bio: `Mock bio for ${user.display_name}`,
    is_admin: user.user_id === mockUsers[0].user_id, // First mock user is admin
    created_at: new Date(
      Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
    ).toISOString(),
    updated_at: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));

  return Promise.resolve({ users, totalPages });
};

/**
 * Get mock popular media
 */
export const getPopularMedia = (): Promise<PopularMedia[]> => {
  console.log("🎭 [MOCK] Getting popular media");

  return Promise.resolve([
    {
      id: "550",
      title: "Fight Club",
      type: "movie",
      release_year: 1999,
      trackingCount: 8,
    },
    {
      id: "13",
      title: "Forrest Gump",
      type: "movie",
      release_year: 1994,
      trackingCount: 7,
    },
    {
      id: "155",
      title: "The Dark Knight",
      type: "movie",
      release_year: 2008,
      trackingCount: 7,
    },
    {
      id: "tt0944947",
      title: "Game of Thrones",
      type: "tv",
      release_year: 2011,
      trackingCount: 6,
    },
    {
      id: "680",
      title: "Pulp Fiction",
      type: "movie",
      release_year: 1994,
      trackingCount: 5,
    },
    {
      id: "tt0903747",
      title: "Breaking Bad",
      type: "tv",
      release_year: 2008,
      trackingCount: 5,
    },
    {
      id: "278",
      title: "The Shawshank Redemption",
      type: "movie",
      release_year: 1994,
      trackingCount: 4,
    },
    {
      id: "238",
      title: "The Godfather",
      type: "movie",
      release_year: 1972,
      trackingCount: 4,
    },
    {
      id: "424",
      title: "Schindler's List",
      type: "movie",
      release_year: 1993,
      trackingCount: 3,
    },
    {
      id: "tt1475582",
      title: "Sherlock",
      type: "tv",
      release_year: 2010,
      trackingCount: 3,
    },
  ]);
};

/**
 * Get mock recent activity
 */
export const getRecentActivity = (): Promise<RecentActivity[]> => {
  console.log("🎭 [MOCK] Getting recent activity");

  const activities: RecentActivity[] = [
    {
      id: "1",
      title: "Inception",
      media_type: "movie",
      status: "pending",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      from_user_id: "2",
      to_user_id: "1",
    },
    {
      id: "2",
      title: "The Matrix",
      media_type: "movie",
      status: "accepted",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      from_user_id: "3",
      to_user_id: "1",
    },
    {
      id: "3",
      title: "Stranger Things",
      media_type: "tv",
      status: "pending",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      from_user_id: "4",
      to_user_id: "2",
    },
    {
      id: "4",
      title: "Parasite",
      media_type: "movie",
      status: "seen",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      from_user_id: "1",
      to_user_id: "3",
    },
    {
      id: "5",
      title: "The Crown",
      media_type: "tv",
      status: "accepted",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      from_user_id: "5",
      to_user_id: "1",
    },
  ];

  return Promise.resolve(activities);
};
