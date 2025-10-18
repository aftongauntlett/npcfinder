import React, { useState, memo, useCallback } from "react";
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
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import Button from "../shared/Button";
import InviteCodeManager from "../admin/InviteCodeManager";
import PageContentContainer from "../layouts/PageContentContainer";
import ConfirmationModal from "../shared/ConfirmationModal";
import { useAdmin } from "../../contexts/AdminContext";
import {
  useAdminStats,
  useAdminUsers,
  usePopularMedia,
  useRecentActivity,
  useToggleAdminStatus,
} from "../../hooks/useAdminQueries";

type StatColor = "blue" | "purple" | "yellow" | "green";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  color: StatColor;
}

interface User {
  id: string;
  display_name: string;
  bio?: string;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Admin Panel Component - Refactored with TanStack Query
 */
const AdminPanel: React.FC = () => {
  const { refreshAdminStatus } = useAdmin();

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "invites">(
    "overview"
  );

  // User list pagination and search
  const [userSearch, setUserSearch] = useState<string>("");
  const [userPage, setUserPage] = useState<number>(0);
  const USERS_PER_PAGE = 5;

  // Admin toggle modal state
  const [showAdminToggleModal, setShowAdminToggleModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<{
    id: string;
    name: string;
    isAdmin: boolean;
  } | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useAdminUsers(userPage, USERS_PER_PAGE, userSearch);
  const { data: popularMedia, isLoading: popularMediaLoading } =
    usePopularMedia();
  const { data: recentActivity, isLoading: recentActivityLoading } =
    useRecentActivity();

  // Mutations
  const toggleAdminMutation = useToggleAdminStatus();

  // Extract users and total pages from query result
  const users = usersData?.users || [];
  const totalUserPages = usersData?.totalPages || 0;

  // Handlers
  const handleToggleAdminClick = useCallback((user: User) => {
    setUserToToggle({
      id: user.id,
      name: user.display_name,
      isAdmin: user.is_admin || false,
    });
    setShowAdminToggleModal(true);
  }, []);

  const confirmToggleAdmin = useCallback(async () => {
    if (!userToToggle) return;

    try {
      await toggleAdminMutation.mutateAsync({
        userId: userToToggle.id,
        makeAdmin: !userToToggle.isAdmin,
      });

      // Refresh admin status in context (in case we're removing our own admin)
      await refreshAdminStatus();
      setShowAdminToggleModal(false);
      setUserToToggle(null);
    } catch (error) {
      console.error("Error toggling admin status:", error);
      alert("An unexpected error occurred");
    }
  }, [userToToggle, toggleAdminMutation, refreshAdminStatus]);

  const handleRefreshData = useCallback(() => {
    void refetchUsers();
  }, [refetchUsers]);

  // Loading state for initial data
  const isLoading = statsLoading;

  if (isLoading) {
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
          <Button onClick={handleRefreshData} variant="secondary">
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
            {stats && (
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
            )}

            {/* Secondary Stats */}
            {stats && (
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
                  <p className="text-gray-300 text-sm mb-1">Connections</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalConnections}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <p className="text-gray-300 text-sm mb-1">Media Items</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalMediaItems}
                  </p>
                </div>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {/* Popular Media */}
              <PopularMediaSection
                popularMedia={popularMedia || []}
                isLoading={popularMediaLoading}
              />

              {/* Users Section */}
              <UsersSection
                users={users}
                isLoading={usersLoading}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                setUserPage={setUserPage}
                userPage={userPage}
                totalUserPages={totalUserPages}
                onToggleAdmin={handleToggleAdminClick}
              />
            </div>

            {/* Recent Activity */}
            <RecentActivitySection
              recentActivity={recentActivity || []}
              isLoading={recentActivityLoading}
            />
          </>
        )}
      </div>

      {/* Admin Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAdminToggleModal}
        onClose={() => {
          setShowAdminToggleModal(false);
          setUserToToggle(null);
        }}
        onConfirm={() => void confirmToggleAdmin()}
        title={
          userToToggle?.isAdmin
            ? "Remove Admin Privileges"
            : "Grant Admin Privileges"
        }
        message={
          userToToggle
            ? userToToggle.isAdmin
              ? `Are you sure you want to remove admin privileges from "${userToToggle.name}"? They will no longer be able to access the admin panel or manage invite codes.`
              : `Are you sure you want to grant admin privileges to "${userToToggle.name}"? They will be able to access the admin panel, manage invite codes, and view all user data.`
            : ""
        }
        confirmText={userToToggle?.isAdmin ? "Remove Admin" : "Make Admin"}
        cancelText="Cancel"
        variant={userToToggle?.isAdmin ? "danger" : "info"}
        isLoading={toggleAdminMutation.isPending}
      />
    </PageContentContainer>
  );
};

// ============================================
// Sub-Components (Memoized for Performance)
// ============================================

/**
 * Stat Card Component
 */
const StatCard = memo<StatCardProps>(({ icon: Icon, title, value, color }) => {
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
});

StatCard.displayName = "StatCard";

/**
 * Popular Media Section
 */
interface PopularMediaSectionProps {
  popularMedia: Array<{
    id: string;
    title: string;
    type: string;
    release_year?: number;
    trackingCount: number;
  }>;
  isLoading: boolean;
}

const PopularMediaSection = memo<PopularMediaSectionProps>(
  ({ popularMedia, isLoading }) => {
    return (
      <section
        className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10"
        aria-labelledby="popular-media-heading"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-400" aria-hidden="true" />
          <h2
            id="popular-media-heading"
            className="text-xl sm:text-2xl font-bold"
          >
            Most Tracked Media
          </h2>
        </div>
        {isLoading ? (
          <p className="text-gray-400 italic">Loading...</p>
        ) : popularMedia.length > 0 ? (
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
    );
  }
);

PopularMediaSection.displayName = "PopularMediaSection";

/**
 * Users Section
 */
interface UsersSectionProps {
  users: User[];
  isLoading: boolean;
  userSearch: string;
  setUserSearch: (search: string) => void;
  setUserPage: (page: number) => void;
  userPage: number;
  totalUserPages: number;
  onToggleAdmin: (user: User) => void;
}

const UsersSection = memo<UsersSectionProps>(
  ({
    users,
    isLoading,
    userSearch,
    setUserSearch,
    setUserPage,
    userPage,
    totalUserPages,
    onToggleAdmin,
  }) => {
    return (
      <section
        className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10"
        aria-labelledby="users-heading"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-blue-400" aria-hidden="true" />
          <h2 id="users-heading" className="text-xl sm:text-2xl font-bold">
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

        {isLoading ? (
          <p className="text-gray-400 italic">Loading users...</p>
        ) : users.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-base sm:text-lg truncate">
                          {user.display_name}
                        </p>
                        {user.is_admin && (
                          <span title="Admin">
                            <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                      {user.bio && (
                        <p className="text-sm text-gray-400 mt-1 italic line-clamp-2">
                          "{user.bio}"
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500">
                          Joined:{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated:{" "}
                          {new Date(user.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleAdmin(user)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          user.is_admin
                            ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/50"
                            : "bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-500/50"
                        }`}
                        title={
                          user.is_admin
                            ? "Remove admin privileges"
                            : "Grant admin privileges"
                        }
                      >
                        {user.is_admin ? (
                          <>
                            <ShieldOff className="w-3 h-3" />
                            <span>Remove Admin</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>Make Admin</span>
                          </>
                        )}
                      </button>
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
                <span className="text-sm text-gray-400" aria-current="page">
                  Page {userPage + 1} of {totalUserPages}
                </span>
                <button
                  onClick={() =>
                    setUserPage(Math.min(totalUserPages - 1, userPage + 1))
                  }
                  disabled={userPage >= totalUserPages - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
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
    );
  }
);

UsersSection.displayName = "UsersSection";

/**
 * Recent Activity Section
 */
interface RecentActivitySectionProps {
  recentActivity: Array<{
    id: string;
    title: string;
    media_type: string;
    status?: string;
    created_at: string;
  }>;
  isLoading: boolean;
}

const RecentActivitySection = memo<RecentActivitySectionProps>(
  ({ recentActivity, isLoading }) => {
    return (
      <section
        className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10"
        aria-labelledby="activity-heading"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-6 h-6 text-green-400" aria-hidden="true" />
          <h2 id="activity-heading" className="text-xl sm:text-2xl font-bold">
            Recent Activity
          </h2>
        </div>
        {isLoading ? (
          <p className="text-gray-400 italic">Loading activity...</p>
        ) : recentActivity.length > 0 ? (
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
                    Activity
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
                      {activity.title || "Unknown"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-purple-500/20 rounded text-xs">
                        {activity.media_type || "N/A"}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {activity.status || "pending"}
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-gray-400">
                        Recommendation
                      </span>
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
    );
  }
);

RecentActivitySection.displayName = "RecentActivitySection";

export default AdminPanel;
