import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Star,
  UserPlus,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Shield,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import ContentLayout from "../../layouts/ContentLayout";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import StatCard from "../../shared/common/StatCard";
import Button from "../../shared/ui/Button";
import Input from "../../shared/ui/Input";
import EmptyState from "../../shared/common/EmptyState";
import Toast from "../../ui/Toast";
import { logger } from "@/lib/logger";
import { useAdmin } from "../../../contexts/AdminContext";
import {
  useAdminStats,
  useAdminUsers,
  useToggleUserRole,
  useInviteCodes,
  useCreateInviteCode,
  useRevokeInviteCode,
} from "../../../hooks/useAdminQueries";
import type { InviteCode } from "../../../lib/inviteCodes";
import type { UserRole } from "../../../contexts/AdminContext";
import { format } from "date-fns";
import { usePageMeta } from "../../../hooks/usePageMeta";

interface User {
  id: string;
  display_name: string;
  email?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Admin Panel",
  description: "Manage users, invite codes, and security settings",
  noIndex: true,
};

/**
 * Consolidated Admin Page - User management, invite codes, and security
 */
const AdminPage: React.FC = () => {
  usePageMeta(pageMetaOptions);
  const { isSuperAdmin, refreshAdminStatus } = useAdmin();

  // User list pagination and search
  const [userSearch, setUserSearch] = useState<string>("");
  const [userPage, setUserPage] = useState<number>(0);
  const USERS_PER_PAGE = 5;

  // Role toggle modal state
  const [showRoleToggleModal, setShowRoleToggleModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<{
    id: string;
    name: string;
    currentRole: UserRole;
    newRole: "user" | "admin";
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

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Queries
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(
    userPage,
    USERS_PER_PAGE,
    userSearch
  );
  const { data: codes = [], isLoading: codesLoading } = useInviteCodes();

  // Mutations
  const toggleRoleMutation = useToggleUserRole();
  const createCodeMutation = useCreateInviteCode();
  const revokeMutation = useRevokeInviteCode();

  // Extract users and total pages from query result
  const users = usersData?.users || [];
  const totalUserPages = usersData?.totalPages || 0;

  // Check if user can be demoted based on role
  const canDemoteUser = useCallback(
    (user: User) => {
      // Super admin cannot be demoted
      if (user.role === "super_admin") return false;
      // Only super admin can demote other admins
      if (user.role === "admin" && !isSuperAdmin) return false;
      return true;
    },
    [isSuperAdmin]
  );

  // User Management Handlers
  const handleToggleRoleClick = useCallback(
    (user: User) => {
      // Check if user can be demoted
      if (!canDemoteUser(user)) {
        const reason =
          user.role === "super_admin"
            ? "Cannot modify super admin role"
            : "Only super admin can demote other admins";
        setToastMessage(reason);
        setShowToast(true);
        return;
      }

      setUserToToggle({
        id: user.id,
        name: user.display_name,
        currentRole: user.role,
        newRole: user.role === "admin" ? "user" : "admin",
      });
      setShowRoleToggleModal(true);
    },
    [canDemoteUser]
  );

  const confirmToggleRole = useCallback(async () => {
    if (!userToToggle) return;

    try {
      await toggleRoleMutation.mutateAsync({
        userId: userToToggle.id,
        newRole: userToToggle.newRole,
      });

      await refreshAdminStatus();
      setShowRoleToggleModal(false);
      setUserToToggle(null);
    } catch (error) {
      logger.error("Failed to toggle admin status", error);
      setToastMessage("An unexpected error occurred");
      setShowToast(true);
    }
  }, [userToToggle, toggleRoleMutation, refreshAdminStatus]);

  // Invite Code Handlers
  const handleCreateCode = useCallback(async () => {
    if (!intendedEmail.trim()) {
      setToastMessage("Please enter an email address");
      setShowToast(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(intendedEmail)) {
      setToastMessage("Please enter a valid email address");
      setShowToast(true);
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
      logger.error("Failed to create invite code", error);
      setToastMessage("Failed to create invite code");
      setShowToast(true);
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
      logger.error("Failed to revoke invite code", error);
      setToastMessage("Failed to revoke invite code");
      setShowToast(true);
    }
  }, [codeToRevoke, revokeMutation]);

  const copyCodeOnly = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      logger.error("Failed to copy code", err);
      setToastMessage("Failed to copy code");
      setShowToast(true);
    }
  }, []);

  const copyCodeWithMessage = useCallback(async (code: string) => {
    const message = `Join our app! Use this invite code: ${code}\n\nSign up at: ${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(message);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      logger.error("Failed to copy invite message", err);
      setToastMessage("Failed to copy message");
      setShowToast(true);
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
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.totalUsers}
                  iconColor="text-blue-400"
                  valueColor="text-white dark:text-white"
                />
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <StatCard
                  icon={Star}
                  label="New This Week"
                  value={stats.newUsersThisWeek}
                  iconColor="text-yellow-400"
                  valueColor="text-yellow-400"
                />
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <StatCard
                  icon={Activity}
                  label="Total Ratings"
                  value={stats.totalRatings}
                  iconColor="text-green-400"
                  valueColor="text-green-400"
                />
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <StatCard
                  icon={ShieldCheck}
                  label="Invite Codes"
                  value={stats.totalInviteCodes}
                  iconColor="text-primary"
                  valueColor="text-primary"
                />
              </motion.div>
            </div>
          )}

          {/* User Management Section - Only show when more than 1 user */}
          {stats && stats.totalUsers > 1 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  User Management
                </h2>
              </div>

              {/* User Search */}
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(0);
                }}
                leftIcon={<Search className="w-5 h-5" />}
              />

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
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
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
                          <motion.tr
                            key={user.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <motion.div
                                  className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center"
                                  whileHover={{ rotate: 5 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                  }}
                                >
                                  <span className="text-sm font-medium text-white">
                                    {user.display_name.charAt(0).toUpperCase()}
                                  </span>
                                </motion.div>
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
                              {user.role === "super_admin" ? (
                                <Button
                                  disabled
                                  variant="primary"
                                  size="sm"
                                  className="gap-1.5"
                                  aria-label="Super Admin - cannot be demoted"
                                  title="Super Admin - cannot be demoted"
                                >
                                  <Shield
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                  Super Admin
                                </Button>
                              ) : user.role === "admin" ? (
                                <Button
                                  onClick={() => handleToggleRoleClick(user)}
                                  disabled={!isSuperAdmin}
                                  variant="primary"
                                  size="sm"
                                  className="gap-1.5"
                                  aria-label={
                                    !isSuperAdmin
                                      ? "Only super admin can demote admins"
                                      : "Click to remove admin privileges"
                                  }
                                  title={
                                    !isSuperAdmin
                                      ? "Only super admin can demote admins"
                                      : "Click to remove admin privileges"
                                  }
                                >
                                  <ShieldCheck
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                  Admin
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleToggleRoleClick(user)}
                                  variant="subtle"
                                  size="sm"
                                  aria-label="Click to make admin"
                                  title="Click to make admin"
                                >
                                  User
                                </Button>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {users.map((user) => (
                      <motion.div
                        key={user.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center"
                            whileHover={{ rotate: 5 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 20,
                            }}
                          >
                            <span className="text-base font-medium text-white">
                              {user.display_name.charAt(0).toUpperCase()}
                            </span>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium text-gray-900 dark:text-white truncate">
                              {user.display_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {user.email || "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Joined:{" "}
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                          {user.role === "super_admin" ? (
                            <Button
                              disabled
                              variant="primary"
                              size="sm"
                              className="gap-1.5"
                              aria-label="Super Admin - cannot be demoted"
                              title="Super Admin - cannot be demoted"
                            >
                              <Shield className="w-4 h-4" aria-hidden="true" />
                              Super Admin
                            </Button>
                          ) : user.role === "admin" ? (
                            <Button
                              onClick={() => handleToggleRoleClick(user)}
                              disabled={!isSuperAdmin}
                              variant="primary"
                              size="sm"
                              className="gap-1.5"
                              aria-label={
                                !isSuperAdmin
                                  ? "Only super admin can demote admins"
                                  : "Click to remove admin privileges"
                              }
                              title={
                                !isSuperAdmin
                                  ? "Only super admin can demote admins"
                                  : "Click to remove admin privileges"
                              }
                            >
                              <ShieldCheck
                                className="w-4 h-4"
                                aria-hidden="true"
                              />
                              Admin
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleToggleRoleClick(user)}
                              variant="subtle"
                              size="sm"
                              aria-label="Click to make admin"
                              title="Click to make admin"
                            >
                              User
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalUserPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Page {userPage + 1} of {totalUserPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                          disabled={userPage === 0}
                          variant="subtle"
                          size="icon"
                          icon={<ChevronLeft className="w-5 h-5" />}
                          aria-label="Previous page"
                        />
                        <Button
                          onClick={() =>
                            setUserPage((p) =>
                              Math.min(totalUserPages - 1, p + 1)
                            )
                          }
                          disabled={userPage >= totalUserPages - 1}
                          variant="subtle"
                          size="icon"
                          icon={<ChevronRight className="w-5 h-5" />}
                          aria-label="Next page"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Invite Code Management Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Invite Code Management
              </h2>
              {!showCreateForm && codes.length > 0 && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="action"
                  icon={<Sparkles className="w-4 h-4" />}
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
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
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
                        <motion.tr
                          key={code.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                            newlyCreatedCodes.has(code.code)
                              ? "bg-green-50 dark:bg-green-900/20"
                              : ""
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
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
                              <motion.div
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              >
                                <Button
                                  onClick={() => void copyCodeOnly(code.code)}
                                  variant="subtle"
                                  size="sm"
                                >
                                  {copiedCode === code.code
                                    ? "Copied!"
                                    : "Copy"}
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              >
                                <Button
                                  onClick={() =>
                                    void copyCodeWithMessage(code.code)
                                  }
                                  variant="subtle"
                                  size="sm"
                                >
                                  Copy Msg
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              >
                                <Button
                                  onClick={() =>
                                    handleRevokeCode(code.id, code.code)
                                  }
                                  variant="danger"
                                  size="sm"
                                >
                                  Delete
                                </Button>
                              </motion.div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {codes.map((code) => (
                    <motion.div
                      key={code.id}
                      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 ${
                        newlyCreatedCodes.has(code.code)
                          ? "ring-2 ring-green-500 dark:ring-green-400"
                          : ""
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <code className="block text-sm font-mono font-semibold text-gray-900 dark:text-white break-all">
                            {code.code}
                          </code>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            For: {code.intended_email || "Any"}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(code)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">
                            Uses
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {code.current_uses} / {code.max_uses}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">
                            Expires
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {code.expires_at
                              ? format(new Date(code.expires_at), "MMM d, yyyy")
                              : "Never"}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          onClick={() => void copyCodeOnly(code.code)}
                          variant="subtle"
                          size="sm"
                          fullWidth
                        >
                          {copiedCode === code.code ? "Copied!" : "Copy"}
                        </Button>
                        <Button
                          onClick={() => void copyCodeWithMessage(code.code)}
                          variant="subtle"
                          size="sm"
                          fullWidth
                        >
                          Copy Msg
                        </Button>
                        <Button
                          onClick={() => handleRevokeCode(code.id, code.code)}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
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

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-1">
                      Auto-Expiring Codes
                    </h3>
                    <p className="text-sm text-primary/80">
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

        {/* Role Toggle Confirmation Modal */}
        <ConfirmationModal
          isOpen={showRoleToggleModal}
          onClose={() => {
            setShowRoleToggleModal(false);
            setUserToToggle(null);
          }}
          onConfirm={() => void confirmToggleRole()}
          title={
            userToToggle?.newRole === "admin"
              ? "Grant Admin Privileges"
              : "Remove Admin Privileges"
          }
          message={
            userToToggle
              ? userToToggle.newRole === "admin"
                ? `Are you sure you want to grant admin privileges to ${userToToggle.name}? They will have full access to manage users and invite codes.`
                : `Are you sure you want to remove admin privileges from ${userToToggle.name}? They will no longer have access to the admin panel.`
              : ""
          }
          confirmText={
            userToToggle?.newRole === "admin" ? "Grant Admin" : "Remove Admin"
          }
          cancelText="Cancel"
          variant="danger"
          isLoading={toggleRoleMutation.isPending}
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

        {/* Toast Notification */}
        {showToast && (
          <Toast message={toastMessage} onClose={() => setShowToast(false)} />
        )}
      </ContentLayout>
    </MainLayout>
  );
};

export default AdminPage;
