import React, { useState, useCallback } from "react";
import {
  Users,
  Star,
  UserPlus,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import ContentLayout from "../../layouts/ContentLayout";
import ConfirmationModal from "../../shared/ConfirmationModal";
import StatCard from "../../shared/StatCard";
import { useAdmin } from "../../../contexts/AdminContext";
import {
  useAdminStats,
  useAdminUsers,
  useToggleAdminStatus,
} from "../../../hooks/useAdminQueries";

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
 * Admin Overview Page - Platform insights and user management
 */
const AdminOverview: React.FC = () => {
  const { refreshAdminStatus } = useAdmin();

  // Super admin user ID (protected from admin privilege revocation)
  const SUPER_ADMIN_ID =
    import.meta.env.VITE_SUPER_ADMIN_USER_ID ||
    "adfa92d6-532b-47be-9101-bbfced9f73b4";

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
      <MainLayout>
        <ContentLayout
          title="Admin Panel - Overview"
          description="Platform insights and user management"
        >
          <div className="flex items-center justify-center py-20">
            <div
              className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent"
              role="status"
              aria-label="Loading admin data"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </ContentLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ContentLayout
        title="Admin Panel - Overview"
        description="Platform insights and user management"
      >
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
              <p className="text-gray-300 text-sm mb-2">Avg Friends</p>
              <p className="text-2xl font-bold text-white">
                {stats.avgRatingsPerUser}
              </p>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">User Management</h3>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Search users"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {usersLoading ? (
            <div className="text-center py-8 text-gray-300 px-6">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400 px-6">
              No users found{userSearch && ` matching "${userSearch}"`}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left bg-white/5">
                      <th className="py-3 px-6 text-sm font-semibold text-gray-300">
                        User
                      </th>
                      <th className="py-3 px-6 text-sm font-semibold text-gray-300">
                        Email
                      </th>
                      <th className="py-3 px-6 text-sm font-semibold text-gray-300">
                        Role
                      </th>
                      <th className="py-3 px-6 text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="font-medium text-white">
                            {user.display_name}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300 text-sm">
                            {user.email || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.is_admin
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                                : "bg-gray-500/20 text-gray-300 border border-gray-500/50"
                            }`}
                          >
                            {user.is_admin ? (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                Admin
                              </>
                            ) : (
                              "User"
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {user.id !== SUPER_ADMIN_ID ? (
                            <button
                              onClick={() => handleToggleAdminClick(user)}
                              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 px-3 py-1.5 rounded-lg ${
                                user.is_admin
                                  ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 focus-visible:ring-red-500"
                                  : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 focus-visible:ring-purple-500"
                              }`}
                              aria-label={
                                user.is_admin
                                  ? `Remove admin privileges from ${user.display_name}`
                                  : `Grant admin privileges to ${user.display_name}`
                              }
                            >
                              <ShieldCheck className="w-4 h-4" />
                              {user.is_admin ? "Remove Admin" : "Make Admin"}
                            </button>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 cursor-not-allowed px-3 py-1.5"
                              title="Super admin privileges cannot be modified"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Protected</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                  <button
                    onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                    disabled={userPage === 0}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {userPage + 1} of {totalUserPages}
                  </span>
                  <button
                    onClick={() =>
                      setUserPage((p) => Math.min(totalUserPages - 1, p + 1))
                    }
                    disabled={userPage >= totalUserPages - 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
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
              : "Grant Admin Access"
          }
          message={
            userToToggle
              ? userToToggle.isAdmin
                ? `Are you sure you want to remove admin privileges from "${userToToggle.name}"? They will no longer be able to access the admin panel or manage invite codes.`
                : `Are you sure you want to grant admin privileges to "${userToToggle.name}"? They will be able to access the admin panel, manage invite codes, and view all user data.`
              : ""
          }
          confirmText={userToToggle?.isAdmin ? "Remove Admin" : "Grant Admin"}
          cancelText="Cancel"
          variant={userToToggle?.isAdmin ? "danger" : "warning"}
          isLoading={toggleAdminMutation.isPending}
        />
      </ContentLayout>
    </MainLayout>
  );
};

export default AdminOverview;
