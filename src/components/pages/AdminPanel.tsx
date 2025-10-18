import React, { useState, memo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import MainLayout from "../layouts/MainLayout";
import ContentLayout from "../layouts/ContentLayout";
import ConfirmationModal from "../shared/ConfirmationModal";
import StatCard from "../shared/StatCard";
import { useAdmin } from "../../contexts/AdminContext";
import {
  useAdminStats,
  useAdminUsers,
  usePopularMedia,
  useRecentActivity,
  useToggleAdminStatus,
} from "../../hooks/useAdminQueries";
import InviteCodeManager from "../admin/InviteCodeManager";

interface User {
  id: string;
  display_name: string;
  email?: string;
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
  const location = useLocation();

  // Super admin user ID (protected from admin privilege revocation)
  const SUPER_ADMIN_ID =
    import.meta.env.VITE_SUPER_ADMIN_USER_ID ||
    "adfa92d6-532b-47be-9101-bbfced9f73b4";

  // Get tab from URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get("tab") as
    | "overview"
    | "invite-codes"
    | null;

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "invite-codes">(
    tabFromUrl || "overview"
  );

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(
    userPage,
    USERS_PER_PAGE,
    userSearch
  );
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
    <MainLayout>
      <ContentLayout
        title="Admin Panel"
        description="Platform insights and user management"
      >
        {/* Tab Content */}
        {activeTab === "invite-codes" ? (
          <InviteCodeManager />
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.totalUsers}
                  iconColor="text-blue-400"
                  valueColor="text-blue-400"
                />
                <StatCard
                  icon={Activity}
                  label="Active (30d)"
                  value={stats.activeUsers}
                  iconColor="text-green-400"
                  valueColor="text-green-400"
                />
                <StatCard
                  icon={UserPlus}
                  label="New This Week"
                  value={stats.newUsersThisWeek}
                  iconColor="text-purple-400"
                  valueColor="text-purple-400"
                />
                <StatCard
                  icon={Star}
                  label="Avg Ratings/User"
                  value={stats.avgRatingsPerUser}
                  iconColor="text-yellow-400"
                  valueColor="text-yellow-400"
                />
              </div>
            )}

            {/* Secondary Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center">
                  <p className="text-gray-300 text-sm mb-2">New This Month</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.newUsersThisMonth}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center">
                  <p className="text-gray-300 text-sm mb-2">Total Ratings</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalRatings}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center">
                  <p className="text-gray-300 text-sm mb-2">Connections</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalConnections}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center">
                  <p className="text-gray-300 text-sm mb-2">Media Items</p>
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
                superAdminId={SUPER_ADMIN_ID}
              />
            </div>

            {/* Recent Activity */}
            <RecentActivitySection
              recentActivity={recentActivity || []}
              isLoading={recentActivityLoading}
            />
          </>
        )}
      </ContentLayout>

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
    </MainLayout>
  );
};

// ============================================
// Sub-Components (Memoized for Performance)
// ============================================

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
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
        aria-labelledby="popular-media-heading"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp
            className="w-6 h-6 text-primary dark:text-primary-light"
            aria-hidden="true"
          />
          <h2
            id="popular-media-heading"
            className="text-xl font-bold text-gray-900 dark:text-white font-heading"
          >
            Most Tracked Media
          </h2>
        </div>
        {isLoading ? (
          <p className="text-gray-600 dark:text-gray-400 italic">Loading...</p>
        ) : popularMedia.length > 0 ? (
          <div className="space-y-3">
            {popularMedia.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-2xl font-bold text-primary dark:text-primary-light min-w-8">
                  #{index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-gray-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.type} • {item.release_year || "N/A"}
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary dark:text-primary-light rounded-full text-sm font-medium whitespace-nowrap">
                  {item.trackingCount}{" "}
                  {item.trackingCount === 1 ? "user" : "users"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 italic">
            No tracked media yet
          </p>
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
  superAdminId: string;
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
    superAdminId,
  }) => {
    return (
      <section
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
        aria-labelledby="users-heading"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users
            className="w-6 h-6 text-primary dark:text-primary-light"
            aria-hidden="true"
          />
          <h2
            id="users-heading"
            className="text-xl font-bold text-gray-900 dark:text-white font-heading"
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
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {isLoading ? (
          <p className="text-gray-600 dark:text-gray-400 italic">
            Loading users...
          </p>
        ) : users.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-base sm:text-lg truncate text-gray-900 dark:text-white">
                          {user.display_name}
                        </p>
                        {user.is_admin && (
                          <span title="Admin">
                            <ShieldCheck className="w-4 h-4 text-primary dark:text-primary-light flex-shrink-0" />
                          </span>
                        )}
                      </div>
                      {user.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {user.email}
                        </p>
                      )}
                      {user.bio && (
                        <p className="text-sm text-gray-400 mt-1 italic line-clamp-2">
                          "{user.bio}"
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-400">
                          Joined:{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Updated:{" "}
                          {new Date(user.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      {user.id === superAdminId ? (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/50">
                          <Shield className="w-3 h-3" />
                          <span>Owner</span>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  </div>
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
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
        aria-labelledby="activity-heading"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity
            className="w-6 h-6 text-primary dark:text-primary-light"
            aria-hidden="true"
          />
          <h2
            id="activity-heading"
            className="text-xl font-bold text-gray-900 dark:text-white font-heading"
          >
            Recent Activity
          </h2>
        </div>
        {isLoading ? (
          <p className="text-gray-600 dark:text-gray-400 italic">
            Loading activity...
          </p>
        ) : recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 text-gray-600 dark:text-gray-400 font-medium">
                    Media
                  </th>
                  <th className="text-left p-3 text-gray-600 dark:text-gray-400 font-medium">
                    Type
                  </th>
                  <th className="text-left p-3 text-gray-600 dark:text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-left p-3 text-gray-600 dark:text-gray-400 font-medium">
                    Activity
                  </th>
                  <th className="text-left p-3 text-gray-600 dark:text-gray-400 font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
