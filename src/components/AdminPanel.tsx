import React, { useState, useEffect } from "react";
import {
  Users,
  Star,
  UserPlus,
  TrendingUp,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Button from "./shared/Button";
import InviteCodeManager from "./admin/InviteCodeManager";
import PageContentContainer from "./shared/PageContentContainer";

interface Stats {
  totalUsers: number;
  totalMediaItems: number;
  totalRatings: number;
  totalFriendships: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers: number;
  avgRatingsPerUser: number;
}

interface User {
  id: string;
  display_name: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface PopularMediaItem {
  id: string;
  title: string;
  type: string;
  release_year?: number;
  trackingCount: number;
}

interface RecentActivityItem {
  id: string;
  status: string;
  personal_rating?: number;
  created_at: string;
  media_items?: {
    title?: string;
    type?: string;
  };
}

type StatColor = "blue" | "purple" | "yellow" | "green";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  color: StatColor;
}

const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMediaItems: 0,
    totalRatings: 0,
    totalFriendships: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    activeUsers: 0,
    avgRatingsPerUser: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [popularMedia, setPopularMedia] = useState<PopularMediaItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "invites">(
    "overview"
  );

  // User list pagination and search
  const [userSearch, setUserSearch] = useState<string>("");
  const [userPage, setUserPage] = useState<number>(0);
  const [totalUserPages, setTotalUserPages] = useState<number>(0);
  const USERS_PER_PAGE = 5;

  // Fetch all admin data
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Calculate date ranges
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch counts
      const [mediaCount, ratingsCount, friendsCount] = await Promise.all([
        supabase
          .from("media_items")
          .select("*", { count: "exact", head: true }),
        supabase.from("user_media").select("*", { count: "exact", head: true }),
        supabase
          .from("friends")
          .select("*", { count: "exact", head: true })
          .eq("status", "accepted"),
      ]);

      // Get total users from user_profiles table
      const { count: userCount } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      // Get new users this week
      const { count: weekUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo.toISOString());

      // Get new users this month
      const { count: monthUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneMonthAgo.toISOString());

      // Get active users (users who have added/rated media in last 30 days)
      const { data: activeUserData } = await supabase
        .from("user_media")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(
        activeUserData?.map((item: { user_id: string }) => item.user_id) || []
      ).size;

      // Calculate average ratings per user
      const avgRatings =
        userCount && userCount > 0
          ? Math.round((ratingsCount.count || 0) / userCount)
          : 0;

      setStats({
        totalUsers: userCount || 0,
        totalMediaItems: mediaCount.count || 0,
        totalRatings: ratingsCount.count || 0,
        totalFriendships: friendsCount.count || 0,
        newUsersThisWeek: weekUsers || 0,
        newUsersThisMonth: monthUsers || 0,
        activeUsers: uniqueActiveUsers,
        avgRatingsPerUser: avgRatings,
      });

      // Fetch popular media (most tracked items)
      const { data: userMediaData } = await supabase
        .from("user_media")
        .select("media_id");

      // Count occurrences of each media_id
      const mediaCounts: Record<string, number> = {};
      userMediaData?.forEach((item: { media_id: string }) => {
        mediaCounts[item.media_id] = (mediaCounts[item.media_id] || 0) + 1;
      });

      // Get top 10 media IDs
      const topMediaIds = Object.entries(mediaCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      // Fetch details for popular media
      if (topMediaIds.length > 0) {
        const { data: popularMediaData } = await supabase
          .from("media_items")
          .select("*")
          .in("id", topMediaIds);

        // Add tracking count to each item
        const mediaWithCounts: PopularMediaItem[] =
          popularMediaData?.map(
            (item: {
              id: string;
              title: string;
              type: string;
              release_year: number;
            }) => ({
              id: item.id,
              title: item.title,
              type: item.type,
              release_year: item.release_year,
              trackingCount: mediaCounts[item.id],
            })
          ) || [];

        setPopularMedia(
          mediaWithCounts.sort((a, b) => b.trackingCount - a.trackingCount)
        );
      }

      // Fetch recent activity (last 10 ratings/additions)
      const { data: recentRatings } = await supabase
        .from("user_media")
        .select(
          `
          *,
          media_items (
            title,
            type
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentActivity(recentRatings || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  // Separate function to fetch users with pagination and search
  const fetchUsers = async () => {
    try {
      let query = supabase
        .from("user_profiles")
        .select("user_id, display_name, bio, created_at, updated_at", {
          count: "exact",
        });

      // Apply search filter if there's a search term
      if (userSearch.trim()) {
        query = query.or(
          `display_name.ilike.%${userSearch}%,bio.ilike.%${userSearch}%`
        );
      }

      // Get total count for pagination
      const { count } = await query;
      setTotalUserPages(Math.ceil((count || 0) / USERS_PER_PAGE));

      // Fetch paginated results
      const { data: userProfiles } = await query
        .order("created_at", { ascending: false })
        .range(userPage * USERS_PER_PAGE, (userPage + 1) * USERS_PER_PAGE - 1);

      const usersList: User[] =
        userProfiles?.map(
          (profile: {
            user_id: string;
            display_name?: string;
            bio?: string;
            created_at: string;
            updated_at: string;
          }) => ({
            id: profile.user_id,
            display_name: profile.display_name || "No Name Set",
            bio: profile.bio,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          })
        ) || [];

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    void fetchAdminData();
  }, []);

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>
          <div className="flex items-center justify-center py-20">
            <div
              className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent"
              role="status"
              aria-label="Loading admin data"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageContentContainer className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-gray-300">
              Platform insights and user management
            </p>
          </div>
          <Button onClick={() => void fetchAdminData()} variant="secondary">
            Refresh Data
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-white/10">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("invites")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "invites"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Invite Codes
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "invites" ? (
          <InviteCodeManager />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <StatCard
                icon={Users}
                title="Total Users"
                value={stats.totalUsers}
                color="blue"
              />
              <StatCard
                icon={Activity}
                title="Active (30d)"
                value={stats.activeUsers}
                color="green"
              />
              <StatCard
                icon={UserPlus}
                title="New This Week"
                value={stats.newUsersThisWeek}
                color="purple"
              />
              <StatCard
                icon={Star}
                title="Avg Ratings/User"
                value={stats.avgRatingsPerUser}
                color="yellow"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-gray-300 text-sm mb-1">New This Month</p>
                <p className="text-2xl font-bold text-white">
                  {stats.newUsersThisMonth}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-gray-300 text-sm mb-1">Total Ratings</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalRatings}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-gray-300 text-sm mb-1">Friendships</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalFriendships}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-gray-300 text-sm mb-1">Media Items</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalMediaItems}
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {/* Popular Media */}
              <section
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10"
                aria-labelledby="popular-media-heading"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp
                    className="w-6 h-6 text-purple-400"
                    aria-hidden="true"
                  />
                  <h2
                    id="popular-media-heading"
                    className="text-xl sm:text-2xl font-bold"
                  >
                    Most Tracked Media
                  </h2>
                </div>
                {popularMedia.length > 0 ? (
                  <div className="space-y-3">
                    {popularMedia.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-xl sm:text-2xl font-bold text-purple-400 min-w-8">
                          #{index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{item.title}</p>
                          <p className="text-sm text-gray-400">
                            {item.type} • {item.release_year || "N/A"}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-purple-500/20 rounded-full text-sm font-medium whitespace-nowrap">
                          {item.trackingCount}{" "}
                          {item.trackingCount === 1 ? "user" : "users"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No tracked media yet</p>
                )}
              </section>

              {/* Recent Users */}
              <section
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10"
                aria-labelledby="users-heading"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-6 h-6 text-blue-400" aria-hidden="true" />
                  <h2
                    id="users-heading"
                    className="text-xl sm:text-2xl font-bold"
                  >
                    Users
                  </h2>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <label htmlFor="user-search" className="sr-only">
                    Search users
                  </label>
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="user-search"
                    type="text"
                    placeholder="Search by name or bio..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(0); // Reset to first page on search
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {users.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {users.map((user) => (
                        <article
                          key={user.id}
                          className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base sm:text-lg truncate">
                                {user.display_name}
                              </p>
                              {user.bio && (
                                <p className="text-sm text-gray-400 mt-1 italic line-clamp-2">
                                  "{user.bio}"
                                </p>
                              )}
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <p className="text-xs text-gray-500">
                                Joined:{" "}
                                {new Date(user.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Updated:{" "}
                                {new Date(user.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            ID: {user.id}
                          </p>
                        </article>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalUserPages > 1 && (
                      <nav
                        className="flex items-center justify-between pt-4 border-t border-white/10"
                        aria-label="User pagination"
                      >
                        <button
                          onClick={() => setUserPage(Math.max(0, userPage - 1))}
                          disabled={userPage === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                          <span className="hidden sm:inline">Previous</span>
                        </button>
                        <span
                          className="text-sm text-gray-400"
                          aria-current="page"
                        >
                          Page {userPage + 1} of {totalUserPages}
                        </span>
                        <button
                          onClick={() =>
                            setUserPage(
                              Math.min(totalUserPages - 1, userPage + 1)
                            )
                          }
                          disabled={userPage >= totalUserPages - 1}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Next page"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </button>
                      </nav>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 italic">
                    {userSearch
                      ? "No users found matching your search"
                      : "No users yet"}
                  </p>
                )}
              </section>
            </div>

            {/* Recent Activity */}
            <section
              className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10"
              aria-labelledby="activity-heading"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity
                  className="w-6 h-6 text-green-400"
                  aria-hidden="true"
                />
                <h2
                  id="activity-heading"
                  className="text-xl sm:text-2xl font-bold"
                >
                  Recent Activity
                </h2>
              </div>
              {recentActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-gray-400 font-medium">
                          Media
                        </th>
                        <th className="text-left p-3 text-gray-400 font-medium">
                          Type
                        </th>
                        <th className="text-left p-3 text-gray-400 font-medium">
                          Status
                        </th>
                        <th className="text-left p-3 text-gray-400 font-medium">
                          Rating
                        </th>
                        <th className="text-left p-3 text-gray-400 font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((activity) => (
                        <tr
                          key={activity.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-3 font-medium">
                            {activity.media_items?.title || "Unknown"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-purple-500/20 rounded text-xs">
                              {activity.media_items?.type || "N/A"}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{activity.status}</td>
                          <td className="p-3">
                            {activity.personal_rating ? (
                              <div
                                className="flex items-center gap-1"
                                aria-label={`${activity.personal_rating} stars`}
                              >
                                {[...Array(activity.personal_rating)].map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                      aria-hidden="true"
                                    />
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-400">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 italic">No activity yet</p>
              )}
            </section>
          </>
        )}
      </div>
    </PageContentContainer>
  );
};

// Stat Card Component
const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  color,
}) => {
  const colorClasses: Record<StatColor, string> = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
  };

  const iconColorClasses: Record<StatColor, string> = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-lg p-4 sm:p-6 border`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon
          className={`w-6 sm:w-8 h-6 sm:h-8 ${iconColorClasses[color]}`}
          aria-hidden="true"
        />
        <h3 className="text-gray-300 font-medium text-sm sm:text-base">
          {title}
        </h3>
      </div>
      <p className="text-3xl sm:text-4xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
};

export default AdminPanel;
