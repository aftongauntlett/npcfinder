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
  Plus,
  Shield,
  RefreshCw,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import ContentLayout from "../../layouts/ContentLayout";
import ConfirmationModal from "../../shared/ConfirmationModal";
import StatCard from "../../shared/StatCard";
import Button from "../../shared/Button";
import Input from "../../shared/Input";
import EmptyState from "../../shared/EmptyState";
import { useAdmin } from "../../../contexts/AdminContext";
import {
  useAdminStats,
  useAdminUsers,
  useToggleAdminStatus,
  useInviteCodes,
  useCreateInviteCode,
  useRevokeInviteCode,
} from "../../../hooks/useAdminQueries";
import type { InviteCode } from "../../../lib/inviteCodes";
import { format } from "date-fns";

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
 * Consolidated Admin Page - User management, invite codes, and security
 */
const AdminPage: React.FC = () => {
  const { refreshAdminStatus } = useAdmin();

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

  // Invite code state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newlyCreatedCodes, setNewlyCreatedCodes] = useState<Set<string>>(
    new Set()
  );
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [codeToRevoke, setCodeToRevoke] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [intendedEmail, setIntendedEmail] = useState("");

  // Queries
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(
    userPage,
    USERS_PER_PAGE,
    userSearch
  );
  const { data: codes = [], isLoading: codesLoading } = useInviteCodes();

  // Mutations
  const toggleAdminMutation = useToggleAdminStatus();
  const createCodeMutation = useCreateInviteCode();
  const revokeMutation = useRevokeInviteCode();

  // Extract users and total pages from query result
  const users = usersData?.users || [];
  const totalUserPages = usersData?.totalPages || 0;

  // User Management Handlers
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

      await refreshAdminStatus();
      setShowAdminToggleModal(false);
      setUserToToggle(null);
    } catch (error) {
      console.error("Error toggling admin status:", error);
      alert("An unexpected error occurred");
    }
  }, [userToToggle, toggleAdminMutation, refreshAdminStatus]);

  // Invite Code Handlers
  const handleCreateCode = useCallback(async () => {
    if (!intendedEmail.trim()) {
      alert("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(intendedEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const newCode = await createCodeMutation.mutateAsync(intendedEmail);
      if (newCode) {
        setNewlyCreatedCodes((prev) => new Set(prev).add(newCode.code));
        setIntendedEmail("");
        setShowCreateForm(false);
        setTimeout(() => {
          setNewlyCreatedCodes((prev) => {
            const next = new Set(prev);
            next.delete(newCode.code);
            return next;
          });
        }, 5000);
      }
    } catch (error) {
      console.error("Error creating code:", error);
      alert("Failed to create invite code");
    }
  }, [intendedEmail, createCodeMutation]);

  const handleRevokeCode = useCallback((id: string, code: string) => {
    setCodeToRevoke({ id, code });
    setShowRevokeModal(true);
  }, []);

  const confirmRevoke = useCallback(async () => {
    if (!codeToRevoke) return;

    try {
      await revokeMutation.mutateAsync(codeToRevoke.id);
      setShowRevokeModal(false);
      setCodeToRevoke(null);
    } catch (error) {
      console.error("Error revoking code:", error);
      alert("Failed to revoke invite code");
    }
  }, [codeToRevoke, revokeMutation]);

  const copyCodeOnly = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy code");
    }
  }, []);

  const copyCodeWithMessage = useCallback(async (code: string) => {
    const message = `Join our app! Use this invite code: ${code}\n\nSign up at: ${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(message);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy message");
    }
  }, []);

  const getStatusBadge = useCallback((code: InviteCode) => {
    const now = new Date();
    const isExpired = code.expires_at && new Date(code.expires_at) < now;
    const isUsedUp = code.current_uses >= code.max_uses;

    if (!code.is_active) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
          Inactive
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400">
          Expired
        </span>
      );
    }

    if (isUsedUp) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
          Used
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
        Active
      </span>
    );
  }, []);

  const isLoading = statsLoading || usersLoading || codesLoading;
  const isCreatingCode = createCodeMutation.isPending;

  return (
    <MainLayout>
      <ContentLayout title="Admin Panel">
        <div className="space-y-8">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats.totalUsers}
                iconColor="text-blue-400"
                valueColor="text-white dark:text-white"
              />
              <StatCard
                icon={Star}
                label="New This Week"
                value={stats.newUsersThisWeek}
                iconColor="text-yellow-400"
                valueColor="text-yellow-400"
              />
              <StatCard
                icon={Activity}
                label="Total Ratings"
                value={stats.totalRatings}
                iconColor="text-green-400"
                valueColor="text-green-400"
              />
              <StatCard
                icon={ShieldCheck}
                label="Invite Codes"
                value={stats.totalInviteCodes}
                iconColor="text-purple-400"
                valueColor="text-purple-400"
              />
            </div>
          )}

          {/* User Management Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                User Management
              </h2>
            </div>

            {/* User Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No users found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Admin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.display_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.display_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleAdminClick(user)}
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${
                                user.is_admin
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              {user.is_admin ? "Admin" : "User"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalUserPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Page {userPage + 1} of {totalUserPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                        disabled={userPage === 0}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setUserPage((p) =>
                            Math.min(totalUserPages - 1, p + 1)
                          )
                        }
                        disabled={userPage >= totalUserPages - 1}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Invite Code Management Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Invite Code Management
              </h2>
              {!showCreateForm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  hideTextOnMobile
                  aria-label="Create invite code"
                >
                  Create
                </Button>
              )}
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary dark:text-primary-light">
                  <UserPlus className="w-5 h-5" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Create New Invite Code
                  </h3>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Intended Email"
                    type="email"
                    value={intendedEmail}
                    onChange={(e) => setIntendedEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    ⚡ The invite code can only be used by this email address
                    (extra security)
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="danger"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleCreateCode()}
                    variant="primary"
                    loading={isCreatingCode}
                    disabled={isCreatingCode || !intendedEmail.trim()}
                  >
                    Generate Code
                  </Button>
                </div>
              </div>
            )}

            {/* Codes List */}
            {codes.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="No invite codes yet"
                description="Create your first invite code to get started"
                action={
                  !showCreateForm
                    ? {
                        label: "Create Code",
                        onClick: () => setShowCreateForm(true),
                      }
                    : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        For Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Uses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {codes.map((code) => (
                      <tr
                        key={code.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          newlyCreatedCodes.has(code.code)
                            ? "bg-green-50 dark:bg-green-900/20"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono text-gray-900 dark:text-white">
                            {code.code}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {code.intended_email || "Any"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {code.current_uses} / {code.max_uses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {code.expires_at
                            ? format(new Date(code.expires_at), "MMM d, yyyy")
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(code)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => void copyCodeOnly(code.code)}
                              className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
                            >
                              {copiedCode === code.code ? "Copied!" : "Copy"}
                            </button>
                            <button
                              onClick={() =>
                                void copyCodeWithMessage(code.code)
                              }
                              className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
                            >
                              Copy Msg
                            </button>
                            <button
                              onClick={() =>
                                handleRevokeCode(code.id, code.code)
                              }
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Security Best Practices Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Security Best Practices
            </h2>

            <div className="grid gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Email-Specific Codes
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      All invite codes are tied to specific email addresses.
                      This prevents code sharing and unauthorized access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">
                      Auto-Expiring Codes
                    </h3>
                    <p className="text-sm text-purple-800 dark:text-purple-400">
                      Codes automatically expire after 30 days and can only be
                      used once. Delete unused codes to maintain security.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                      Admin Privileges
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-400">
                      Be careful when granting admin privileges. Admins can
                      manage all users and invite codes. The super admin account
                      cannot be demoted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
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
                ? `Are you sure you want to remove admin privileges from ${userToToggle.name}? They will no longer have access to the admin panel.`
                : `Are you sure you want to grant admin privileges to ${userToToggle.name}? They will have full access to manage users and invite codes.`
              : ""
          }
          confirmText={userToToggle?.isAdmin ? "Remove Admin" : "Grant Admin"}
          cancelText="Cancel"
          variant="danger"
          isLoading={toggleAdminMutation.isPending}
        />

        {/* Revoke Code Confirmation Modal */}
        <ConfirmationModal
          isOpen={showRevokeModal}
          onClose={() => {
            setShowRevokeModal(false);
            setCodeToRevoke(null);
          }}
          onConfirm={() => void confirmRevoke()}
          title="Delete Invite Code"
          message={
            codeToRevoke
              ? `Are you sure you want to permanently delete the code "${codeToRevoke.code}"? This will remove it from the database and cannot be undone.`
              : ""
          }
          confirmText="Delete Code"
          cancelText="Cancel"
          variant="danger"
          isLoading={revokeMutation.isPending}
        />
      </ContentLayout>
    </MainLayout>
  );
};

export default AdminPage;
