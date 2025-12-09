import React from "react";
import MainLayout from "../../layouts/MainLayout";
import ContentLayout from "../../layouts/ContentLayout";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import Toast from "../../ui/Toast";
import { useAdmin } from "../../../contexts/AdminContext";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { useAdminPageLogic } from "../../../hooks/useAdminPageLogic";
import UserManagementSection from "./sections/UserManagementSection";
import InviteCodeSection from "./sections/InviteCodeSection";

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

  const {
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
    usersLoading,
    codesLoading,
    isCreatingCode,
    isTogglingRole,
    isRevokingCode,
  } = useAdminPageLogic(isSuperAdmin, refreshAdminStatus);

  const showUserManagement = (stats?.totalUsers ?? 0) > 1 || users.length > 0;

  return (
    <MainLayout>
      <ContentLayout
        title="Admin Panel"
        description="Manage users and invite codes for your platform"
      >
        <div className="space-y-8">
          {/* Invite Code Management Section */}
          <InviteCodeSection
            codes={codes}
            isLoading={codesLoading}
            showCreateForm={showCreateForm}
            onToggleCreateForm={setShowCreateForm}
            onCreateCode={() => void handleCreateCode()}
            onRevoke={handleRevokeCode}
            onCopyCode={(code) => void copyCodeOnly(code)}
            onCopyWithMessage={(code) => void copyCodeWithMessage(code)}
            copiedCode={copiedCode}
            newlyCreatedCodes={newlyCreatedCodes}
            intendedEmail={intendedEmail}
            onEmailChange={setIntendedEmail}
            isCreating={isCreatingCode}
          />

          {/* User Management Section - Only show when more than 1 user */}
          {showUserManagement && (
            <UserManagementSection
              users={users}
              isLoading={usersLoading}
              searchTerm={userSearch}
              onSearchChange={handleUserSearchChange}
              currentPage={userPage}
              totalPages={totalUserPages}
              itemsPerPage={itemsPerPage}
              totalItems={stats?.totalUsers ?? 0}
              onPageChange={setUserPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              onToggleRole={handleToggleRoleClick}
              canDemoteUser={canDemoteUser}
              isSuperAdmin={isSuperAdmin}
            />
          )}
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
          isLoading={isTogglingRole}
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
          isLoading={isRevokingCode}
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
