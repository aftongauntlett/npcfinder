import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Users,
  Film,
  Star,
  UserPlus,
  TrendingUp,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Button from "./shared/Button";

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMediaItems: 0,
    totalRatings: 0,
    totalFriendships: 0,
  });
  const [users, setUsers] = useState([]);
  const [popularMedia, setPopularMedia] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // User list pagination and search
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [totalUserPages, setTotalUserPages] = useState(0);
  const USERS_PER_PAGE = 5;

  // Fetch all admin data
  const fetchAdminData = async () => {
    setLoading(true);
    try {
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

      setStats({
        totalUsers: userCount || 0,
        totalMediaItems: mediaCount.count || 0,
        totalRatings: ratingsCount.count || 0,
        totalFriendships: friendsCount.count || 0,
      });

      // Fetch popular media (most tracked items)
      const { data: userMediaData } = await supabase
        .from("user_media")
        .select("media_id");

      // Count occurrences of each media_id
      const mediaCounts = {};
      userMediaData?.forEach((item) => {
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
        const mediaWithCounts = popularMediaData?.map((item) => ({
          ...item,
          trackingCount: mediaCounts[item.id],
        }));

        setPopularMedia(
          mediaWithCounts?.sort((a, b) => b.trackingCount - a.trackingCount) ||
            []
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

      // Fetch users for current page (will be called separately)
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

      const usersList =
        userProfiles?.map((profile) => ({
          id: profile.user_id,
          display_name: profile.display_name || "No Name Set",
          bio: profile.bio,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        })) || [];

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-gray-300">
              Platform insights and user management
            </p>
          </div>
          <Button onClick={fetchAdminData} variant="secondary">
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Active Users"
            value={stats.totalUsers}
            color="blue"
          />
          <StatCard
            icon={Film}
            title="Media Items"
            value={stats.totalMediaItems}
            color="purple"
          />
          <StatCard
            icon={Star}
            title="Total Ratings"
            value={stats.totalRatings}
            color="yellow"
          />
          <StatCard
            icon={UserPlus}
            title="Friendships"
            value={stats.totalFriendships}
            color="green"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Popular Media */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">Most Tracked Media</h2>
            </div>
            {popularMedia.length > 0 ? (
              <div className="space-y-3">
                {popularMedia.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl font-bold text-purple-400 min-w-8">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-gray-400">
                        {item.type} • {item.release_year || "N/A"}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-purple-500/20 rounded-full text-sm font-medium">
                      {item.trackingCount}{" "}
                      {item.trackingCount === 1 ? "user" : "users"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No tracked media yet</p>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Users</h2>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
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
                    <div
                      key={user.id}
                      className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {user.display_name}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-gray-400 mt-1 italic">
                              "{user.bio}"
                            </p>
                          )}
                        </div>
                        <div className="text-right">
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
                      <p className="text-xs text-gray-500 font-mono">
                        ID: {user.id}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalUserPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      onClick={() => setUserPage(Math.max(0, userPage - 1))}
                      disabled={userPage === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {userPage + 1} of {totalUserPages}
                    </span>
                    <button
                      onClick={() =>
                        setUserPage(Math.min(totalUserPages - 1, userPage + 1))
                      }
                      disabled={userPage >= totalUserPages - 1}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 italic">
                {userSearch
                  ? "No users found matching your search"
                  : "No users yet"}
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          {recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
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
                          <div className="flex items-center gap-1">
                            {[...Array(activity.personal_rating)].map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
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
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color }) => {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
  };

  const iconColorClasses = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-lg p-6 border`}
    >
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />}
        <h3 className="text-gray-300 font-medium">{title}</h3>
      </div>
      <p className="text-4xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  color: PropTypes.oneOf(["blue", "purple", "yellow", "green"]).isRequired,
};

export default AdminPanel;
