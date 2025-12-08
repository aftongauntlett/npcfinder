import { useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import {
  useAdminStats,
  useAdminUsers,
  useToggleUserRole,
  useInviteCodes,
  useCreateInviteCode,
  useRevokeInviteCode,
} from "./useAdminQueries";
import type { UserRole } from "../contexts/AdminContext";

interface User {
  id: string;
  display_name: string;
  email?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

const USERS_PER_PAGE = 10;

export function useAdminPageLogic(
  isSuperAdmin: boolean,
  refreshAdminStatus: () => Promise<void>
) {
  // User list pagination and search
  const [userSearch, setUserSearch] = useState<string>("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(USERS_PER_PAGE);
  const [userPage, setUserPage] = useState<number>(0);

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
    itemsPerPage,
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

  const handleUserSearchChange = useCallback((value: string) => {
    setUserSearch(value);
    setUserPage(0);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setUserPage(0); // Reset to first page when changing items per page
  }, []);

  return {
    // State
    userSearch,
    userPage,
    itemsPerPage,
    showRoleToggleModal,
    userToToggle,
    copiedCode,
    newlyCreatedCodes,
    showRevokeModal,
    codeToRevoke,
    showCreateForm,
    intendedEmail,
    showToast,
    toastMessage,

    // Setters
    setUserPage,
    setItemsPerPage,
    setShowRoleToggleModal,
    setUserToToggle,
    setShowRevokeModal,
    setCodeToRevoke,
    setShowCreateForm,
    setIntendedEmail,
    setShowToast,

    // Handlers
    handleToggleRoleClick,
    confirmToggleRole,
    handleCreateCode,
    handleRevokeCode,
    confirmRevoke,
    copyCodeOnly,
    copyCodeWithMessage,
    canDemoteUser,
    handleUserSearchChange,
    handleItemsPerPageChange,

    // Query Data
    stats,
    users,
    totalUserPages,
    codes,

    // Loading States
    statsLoading,
    usersLoading,
    codesLoading,
    isCreatingCode: createCodeMutation.isPending,
    isTogglingRole: toggleRoleMutation.isPending,
    isRevokingCode: revokeMutation.isPending,
  };
}
