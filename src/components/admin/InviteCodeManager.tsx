import React, { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Shield,
  Clock,
  Users,
  RefreshCw,
} from "lucide-react";
import Button from "../shared/Button";
import ConfirmationModal from "../shared/ConfirmationModal";
import {
  createInviteCode,
  batchCreateInviteCodes,
  getAllInviteCodes,
  revokeInviteCode,
  getInviteCodeStats,
  type InviteCode,
} from "../../lib/inviteCodes";
import { format } from "date-fns";

/**
 * Admin component for managing invite codes
 * Secure invite-only registration system
 */
const InviteCodeManager: React.FC = () => {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Revoke modal state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [codeToRevoke, setCodeToRevoke] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(30);
  const [batchCount, setBatchCount] = useState(1);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const [codesResult, statsResult] = await Promise.all([
        getAllInviteCodes(),
        getInviteCodeStats(),
      ]);

      if (codesResult.data) {
        setCodes(codesResult.data);
      }
      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Error fetching invite codes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCodes();
  }, []);

  const handleCreateCode = async () => {
    setCreating(true);
    try {
      if (batchCount > 1) {
        const result = await batchCreateInviteCodes(
          batchCount,
          notes,
          maxUses,
          expiresInDays
        );
        if (result.error) {
          alert(`Error creating codes: ${result.error.message}`);
        }
      } else {
        const result = await createInviteCode(notes, maxUses, expiresInDays);
        if (result.error) {
          alert(`Error creating code: ${result.error.message}`);
        }
      }

      // Refresh codes
      await fetchCodes();

      // Reset form
      setShowCreateForm(false);
      setNotes("");
      setMaxUses(1);
      setExpiresInDays(30);
      setBatchCount(1);
    } catch (error) {
      console.error("Error creating invite code:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeCode = (codeId: string, code: string) => {
    setCodeToRevoke({ id: codeId, code });
    setShowRevokeModal(true);
  };

  const confirmRevoke = async () => {
    if (!codeToRevoke) return;

    setRevoking(true);
    try {
      const result = await revokeInviteCode(codeToRevoke.id);
      if (result.error) {
        alert(`Error revoking code: ${result.error.message}`);
      } else {
        await fetchCodes();
        setShowRevokeModal(false);
        setCodeToRevoke(null);
      }
    } catch (error) {
      console.error("Error revoking code:", error);
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      const inviteUrl = `${window.location.origin}/?invite=${code}`;
      const message = `You've been invited to NPC Finder! 🎬\n\nClick this link to join: ${inviteUrl}\n\nOr use this code during sign-up: ${code}\n\nLooking forward to sharing recommendations with you!`;

      await navigator.clipboard.writeText(message);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getStatusBadge = (code: InviteCode) => {
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Invite Codes</h2>
            <p className="text-gray-400 text-sm">
              Manage secure invite-only access
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => void fetchCodes()}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Code
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Codes</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Key className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.active}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Used</p>
              <p className="text-2xl font-bold text-gray-400">{stats.used}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Expired</p>
              <p className="text-2xl font-bold text-orange-400">
                {stats.expired}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Create New Invite Code(s)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., For John Doe"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Uses Per Code
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expires In (days)
              </label>
              <input
                type="number"
                value={expiresInDays || ""}
                onChange={(e) =>
                  setExpiresInDays(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Never"
                min="1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Codes
              </label>
              <input
                type="number"
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                min="1"
                max="50"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => void handleCreateCode()}
              disabled={creating}
              className="flex items-center gap-2"
            >
              {creating
                ? "Creating..."
                : `Create ${batchCount > 1 ? `${batchCount} Codes` : "Code"}`}
            </Button>
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Codes List - Simplified Card Design */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 text-center text-gray-300">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            Loading codes...
          </div>
        ) : codes.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 text-center">
            <Key className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-300">
              No invite codes yet. Create one to get started.
            </p>
          </div>
        ) : (
          codes.map((code) => (
            <div
              key={code.id}
              className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 hover:bg-white/8 transition-all"
            >
              {/* Main Row */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <code className="text-white font-mono text-lg font-semibold">
                    {code.code}
                  </code>
                  <button
                    onClick={() => void copyToClipboard(code.code)}
                    className="text-gray-300 hover:text-white transition-colors p-1"
                    title="Copy invitation message with link and code"
                  >
                    {copiedCode === code.code ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(code)}
                  {code.is_active && !code.used_by && (
                    <button
                      onClick={() => handleRevokeCode(code.id, code.code)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Details Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {code.used_by_email && (
                  <span className="text-blue-300">
                    Used by {code.used_by_email}
                  </span>
                )}
                {code.created_by_email && (
                  <span className="text-gray-300">
                    Sent by {code.created_by_email}
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
          ))
        )}
      </div>

      {/* Security Best Practices */}
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
        isLoading={revoking}
      />
    </div>
  );
};

export default InviteCodeManager;
