import React from "react";
import { Sparkles, UserPlus } from "lucide-react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import EmptyStateAddCard from "../../../shared/common/EmptyStateAddCard";
import InviteCodeTable from "../components/InviteCodeTable";
import InviteCodeCard from "../components/InviteCodeCard";
import type { InviteCode } from "../../../../lib/inviteCodes";

interface InviteCodeSectionProps {
  codes: InviteCode[];
  isLoading: boolean;
  showCreateForm: boolean;
  onToggleCreateForm: (show: boolean) => void;
  onCreateCode: () => void;
  onRevoke: (id: string, code: string) => void;
  onCopyCode: (code: string) => void;
  onCopyWithMessage: (code: string) => void;
  copiedCode: string | null;
  newlyCreatedCodes: Set<string>;
  intendedEmail: string;
  onEmailChange: (email: string) => void;
  isCreating: boolean;
}

const InviteCodeSection: React.FC<InviteCodeSectionProps> = ({
  codes,
  isLoading,
  showCreateForm,
  onToggleCreateForm,
  onCreateCode,
  onRevoke,
  onCopyCode,
  onCopyWithMessage,
  copiedCode,
  newlyCreatedCodes,
  intendedEmail,
  onEmailChange,
  isCreating,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Invite Code Management
        </h2>
        {!showCreateForm && codes.length > 0 && (
          <Button
            onClick={() => onToggleCreateForm(true)}
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
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="user@example.com"
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              ⚡ The invite code can only be used by this email address (extra
              security)
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button onClick={() => onToggleCreateForm(false)} variant="danger">
              Cancel
            </Button>
            <Button
              onClick={onCreateCode}
              variant="primary"
              loading={isCreating}
              disabled={isCreating || !intendedEmail.trim()}
              className={!intendedEmail.trim() ? "cursor-not-allowed" : ""}
            >
              Generate Code
            </Button>
          </div>
        </div>
      )}

      {/* Codes List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary"></div>
        </div>
      ) : codes.length === 0 ? (
        <EmptyStateAddCard
          icon={UserPlus}
          title="No invite codes created yet"
          description="Create your first invite code to start inviting users"
          onClick={() => onToggleCreateForm(true)}
          ariaLabel="Create invite code"
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <InviteCodeTable
            codes={codes}
            onRevoke={onRevoke}
            onCopyCode={onCopyCode}
            onCopyWithMessage={onCopyWithMessage}
            copiedCode={copiedCode}
            newlyCreatedCodes={newlyCreatedCodes}
          />

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {codes.map((code) => (
              <InviteCodeCard
                key={code.id}
                code={code}
                onRevoke={onRevoke}
                onCopyCode={onCopyCode}
                onCopyWithMessage={onCopyWithMessage}
                copiedCode={copiedCode}
                isNewlyCreated={newlyCreatedCodes.has(code.code)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default InviteCodeSection;
