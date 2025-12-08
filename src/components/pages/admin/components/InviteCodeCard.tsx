import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import InviteCodeStatusBadge from "./InviteCodeStatusBadge";
import type { InviteCode } from "../../../../lib/inviteCodes";

interface InviteCodeCardProps {
  code: InviteCode;
  onRevoke: (id: string, code: string) => void;
  onCopyCode: (code: string) => void;
  onCopyWithMessage: (code: string) => void;
  copiedCode: string | null;
  isNewlyCreated: boolean;
}

const InviteCodeCard: React.FC<InviteCodeCardProps> = ({
  code,
  onRevoke,
  onCopyCode,
  onCopyWithMessage,
  copiedCode,
  isNewlyCreated,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        spacing="md"
        className={`space-y-3 ${
          isNewlyCreated ? "ring-2 ring-green-500 dark:ring-green-400" : ""
        }`}
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
            <InviteCodeStatusBadge code={code} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Uses</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {code.current_uses} / {code.max_uses}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Expires</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {code.expires_at
                ? format(new Date(code.expires_at), "MMM d, yyyy")
                : "Never"}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => onCopyCode(code.code)}
            variant="subtle"
            size="sm"
            fullWidth
          >
            {copiedCode === code.code ? "Copied!" : "Copy"}
          </Button>
          <Button
            onClick={() => onCopyWithMessage(code.code)}
            variant="subtle"
            size="sm"
            fullWidth
          >
            Copy Msg
          </Button>
          <Button
            onClick={() => onRevoke(code.id, code.code)}
            variant="danger"
            size="sm"
          >
            Delete
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default InviteCodeCard;
