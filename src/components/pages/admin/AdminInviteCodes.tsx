import React from "react";
import MainLayout from "../../layouts/MainLayout";
import ContentLayout from "../../layouts/ContentLayout";
import InviteCodeManager from "../../admin/InviteCodeManager";

/**
 * Admin Invite Codes Page - Manage invite codes
 */
const AdminInviteCodes: React.FC = () => {
  return (
    <MainLayout>
      <ContentLayout
        title="Admin Panel - Invite Codes"
        description="Manage secure invite-only access"
      >
        <InviteCodeManager />
      </ContentLayout>
    </MainLayout>
  );
};

export default AdminInviteCodes;
