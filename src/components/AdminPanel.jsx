import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Users,
  Film,
  Star,
  UserPlus,
  TrendingUp,
  Activity,
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

      // Get total users from auth
      const { count: userCount } = await supabase
        .from("user_media")
        .select("user_id", { count: "exact", head: true });

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

      // Get unique users from user_media for user list
      const { data: userMediaForUsers } = await supabase
        .from("user_media")
        .select("user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      // Get unique users
      const uniqueUsers = {};
      userMediaForUsers?.forEach((item) => {
        if (!uniqueUsers[item.user_id]) {
          uniqueUsers[item.user_id] = item.created_at;
        }
      });

      const usersList = Object.entries(uniqueUsers)
        .map(([id, created_at]) => ({ id, created_at, email: "User" }))
        .slice(0, 10);

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

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
              <h2 className="text-2xl font-bold">Recent Users</h2>
            </div>
            {users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <p className="font-medium">User</p>
                      <p className="text-xs text-gray-400 font-mono">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No users yet</p>
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
