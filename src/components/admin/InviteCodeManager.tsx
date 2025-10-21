import React, { useState, useCallback, memo } from "react";
import {
  Key,
  Plus,
  Shield,
  Clock,
  Users,
  RefreshCw,
  Check,
} from "lucide-react";
import Button from "../shared/Button";
import Input from "../shared/Input";
import ConfirmationModal from "../shared/ConfirmationModal";
import StatCard from "../shared/StatCard";
import EmptyState from "../shared/EmptyState";
import {
  useInviteCodes,
  useInviteCodeStats,
  useCreateInviteCode,
  useRevokeInviteCode,
} from "../../hooks/useAdminQueries";
import type { InviteCode } from "../../lib/inviteCodes";
import { format } from "date-fns";

/**
 * Admin component for managing invite codes - Refactored with TanStack Query
 */
const InviteCodeManager: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newlyCreatedCodes, setNewlyCreatedCodes] = useState<Set<string>>(
    new Set()
  );

  // Revoke modal state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [codeToRevoke, setCodeToRevoke] = useState<{
    id: string;
    code: string;
  } | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [intendedEmail, setIntendedEmail] = useState("");

  // Queries
  const { data: codes = [], isLoading: codesLoading } = useInviteCodes();
  const {
    data: stats = { total: 0, active: 0, used: 0, expired: 0 },
    isLoading: statsLoading,
  } = useInviteCodeStats();

  // Mutations
  const createCodeMutation = useCreateInviteCode();
  const revokeMutation = useRevokeInviteCode();

  // Handlers
  const handleCreateCode = useCallback(async () => {
    if (!intendedEmail.trim()) {
      alert("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(intendedEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const result = await createCodeMutation.mutateAsync(intendedEmail);

      // Mark newly created code for highlighting
      if (result) {
        setNewlyCreatedCodes(new Set([result.code]));

        // Clear highlights after 5 seconds
        setTimeout(() => {
          setNewlyCreatedCodes(new Set());
        }, 5000);
      }

      // Reset form
      setShowCreateForm(false);
      setIntendedEmail("");
    } catch (error) {
      console.error("Error creating invite code:", error);
      alert(
        `Error creating code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [intendedEmail, createCodeMutation]);

  const handleRevokeCode = useCallback((codeId: string, code: string) => {
    setCodeToRevoke({ id: codeId, code });
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
      alert(
        `Error revoking code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [codeToRevoke, revokeMutation]);

  const copyCodeOnly = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(`${code}-code`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  const copyCodeWithMessage = useCallback(async (code: string) => {
    try {
      const inviteUrl = `${window.location.origin}/?invite=${code}`;
      const message = `You've been invited to NPC Finder! 🎬\n\nClick this link to join: ${inviteUrl}\n\nOr use this code during sign-up: ${code}\n\nLooking forward to sharing recommendations with you!`;

      await navigator.clipboard.writeText(message);
      setCopiedCode(`${code}-message`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  const getStatusBadge = useCallback((code: InviteCode) => {
    const now = new Date();
    const isExpired = code.expires_at && new Date(code.expires_at) < now;
    const isUsedUp = code.current_uses >= code.max_uses;

    if (!code.is_active) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/50">
          Revoked
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/50">
          Expired
        </span>
      );
    }
    if (isUsedUp) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/50">
          Redeemed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300 border border-green-500/50">
        Active
      </span>
    );
  }, []);

  const isLoading = codesLoading || statsLoading;
  const isCreating = createCodeMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Create Form */}
      {showCreateForm && (
        <CreateCodeForm
          intendedEmail={intendedEmail}
          setIntendedEmail={setIntendedEmail}
          isCreating={isCreating}
          onSubmit={() => void handleCreateCode()}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Codes List */}
      <CodesList
        codes={codes}
        isLoading={isLoading}
        copiedCode={copiedCode}
        newlyCreatedCodes={newlyCreatedCodes}
        showCreateForm={showCreateForm}
        onCopyCode={(code) => void copyCodeOnly(code)}
        onCopyMessage={(code) => void copyCodeWithMessage(code)}
        onRevoke={handleRevokeCode}
        onCreateNew={() => setShowCreateForm(true)}
        getStatusBadge={getStatusBadge}
      />

      {/* Security Best Practices */}
      <SecurityInfo />

      {/* Revoke Confirmation Modal */}
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
    </div>
  );
};

// ============================================
// Sub-Components (Memoized for Performance)
// ============================================

/**
 * Stats Cards Component - Using shared StatCard
 */
interface StatsCardsProps {
  stats: {
    total: number;
    active: number;
    used: number;
    expired: number;
  };
}

const StatsCards = memo<StatsCardsProps>(({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon={Key}
        label="Total Codes"
        value={stats.total}
        iconColor="text-blue-400"
        valueColor="text-white dark:text-white"
      />
      <StatCard
        icon={Check}
        label="Active"
        value={stats.active}
        iconColor="text-green-400"
        valueColor="text-green-400"
      />
      <StatCard
        icon={Users}
        label="Used"
        value={stats.used}
        iconColor="text-gray-400"
        valueColor="text-gray-400"
      />
      <StatCard
        icon={Clock}
        label="Expired"
        value={stats.expired}
        iconColor="text-orange-400"
        valueColor="text-orange-400"
      />
    </div>
  );
});

StatsCards.displayName = "StatsCards";

/**
 * Create Code Form Component - Simplified
 */
interface CreateCodeFormProps {
  intendedEmail: string;
  setIntendedEmail: (email: string) => void;
  isCreating: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

const CreateCodeForm = memo<CreateCodeFormProps>(
  ({ intendedEmail, setIntendedEmail, isCreating, onSubmit, onCancel }) => {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">
          Create New Invite Code
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          Create a secure invite code for a specific person. The code will
          expire in 30 days and can only be used once by the email address you
          specify.
        </p>
        <div className="mb-4">
          <Input
            id="invite-email"
            label="Recipient's Email Address"
            type="email"
            value={intendedEmail}
            onChange={(e) => setIntendedEmail(e.target.value)}
            placeholder="friend@example.com"
            required
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2">
            ⚡ The invite code can only be used by this email address (extra
            security)
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="!border-red-600 !text-red-600 hover:!bg-red-600 hover:!text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            variant="primary"
            loading={isCreating}
            disabled={isCreating || !intendedEmail.trim()}
          >
            Generate Code
          </Button>
        </div>
      </div>
    );
  }
);

CreateCodeForm.displayName = "CreateCodeForm";

/**
 * Codes List Component
 */
interface CodesListProps {
  codes: InviteCode[];
  isLoading: boolean;
  copiedCode: string | null;
  newlyCreatedCodes: Set<string>;
  showCreateForm: boolean;
  onCopyCode: (code: string) => void;
  onCopyMessage: (code: string) => void;
  onRevoke: (id: string, code: string) => void;
  onCreateNew: () => void;
  getStatusBadge: (code: InviteCode) => React.ReactElement;
}

const CodesList = memo<CodesListProps>(
  ({
    codes,
    isLoading,
    newlyCreatedCodes,
    copiedCode,
    showCreateForm,
    onCopyCode,
    onCopyMessage,
    onRevoke,
    onCreateNew,
    getStatusBadge,
  }) => {
    if (isLoading) {
      return (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 text-center text-gray-300">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
          Loading codes...
        </div>
      );
    }

    if (codes.length === 0 && !showCreateForm) {
      return (
        <EmptyState
          icon={Plus}
          title="Create Invite Code"
          description="Get started by creating your first invite code"
          iconColor="text-purple-400"
          action={{
            label: "Create Invite Code",
            onClick: onCreateNew,
            variant: "primary",
          }}
        />
      );
    }

    return (
      <div className="space-y-3">
        {codes.map((code) => {
          const isNewlyCreated = newlyCreatedCodes.has(code.code);
          const isRedeemed = code.used_by !== null;

          return (
            <div
              key={code.id}
              className={`backdrop-blur-sm rounded-lg border p-4 transition-all ${
                isNewlyCreated
                  ? "bg-purple-500/20 border-purple-500/60 shadow-lg shadow-purple-500/20 animate-pulse"
                  : "bg-white/5 border-white/10 hover:bg-white/8"
              }`}
            >
              {/* Main Row */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <code className="text-white font-mono text-lg font-semibold">
                    {code.code}
                  </code>
                  {isNewlyCreated && (
                    <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-500/50">
                      NEW
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onCopyCode(code.code)}
                      className="text-gray-300 hover:text-white transition-colors px-2 py-1 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Copy code only"
                      aria-label={`Copy code ${code.code}`}
                    >
                      {copiedCode === `${code.code}-code` ? (
                        <span className="text-green-400">✓ Code</span>
                      ) : (
                        "Copy Code"
                      )}
                    </button>
                    <span className="text-gray-500">|</span>
                    <button
                      onClick={() => onCopyMessage(code.code)}
                      className="text-gray-300 hover:text-white transition-colors px-2 py-1 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      title="Copy invitation message with link and code"
                      aria-label={`Copy invitation message for ${code.code}`}
                    >
                      {copiedCode === `${code.code}-message` ? (
                        <span className="text-green-400">✓ Message</span>
                      ) : (
                        "Copy Message"
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(code)}
                  {code.is_active && !isRedeemed && (
                    <button
                      onClick={() => onRevoke(code.id, code.code)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      aria-label={`Revoke code ${code.code}`}
                    >
                      Revoke
                    </button>
                  )}
                  {isRedeemed && (
                    <button
                      onClick={() => onRevoke(code.id, code.code)}
                      className="text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      aria-label={`Delete redeemed code ${code.code}`}
                      title="Remove redeemed code from list"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Details Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {code.used_by && (
                  <span className="text-blue-300">
                    Used by{" "}
                    {code.used_by_email || code.used_by.substring(0, 8) + "..."}
                  </span>
                )}
                {code.intended_email && !code.used_by && (
                  <span className="text-purple-300">
                    Sent to {code.intended_email}
                  </span>
                )}
                <span className="text-gray-300">
                  {format(new Date(code.created_at), "MMM d, yyyy")}
                </span>
                {code.expires_at && (
                  <span className="text-gray-300">
                    Expires {format(new Date(code.expires_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Create New Button - shown only when there are existing codes and form is not open */}
        {codes.length > 0 && !showCreateForm && (
          <div className="flex justify-end">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg border border-dashed border-white/20 hover:border-purple-500/50 px-6 py-3 transition-all hover:bg-white/8 group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              aria-label="Create new invite code"
            >
              <Plus className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <span className="text-white font-medium">
                Create New Invite Code
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }
);

CodesList.displayName = "CodesList";

/**
 * Security Info Component
 */
const SecurityInfo = memo(() => {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <div className="flex gap-3">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-semibold mb-1">Security Best Practices</p>
          <ul className="list-disc list-inside space-y-1 text-blue-300">
            <li>Share codes through encrypted channels (Signal, etc.)</li>
            <li>Generate unique codes per person for accountability</li>
            <li>Set expiration dates (7-30 days recommended)</li>
            <li>Revoke unused codes after a reasonable time</li>
            <li>Monitor usage patterns for suspicious activity</li>
          </ul>
        </div>
      </div>
    </div>
  );
});

SecurityInfo.displayName = "SecurityInfo";

export default InviteCodeManager;
