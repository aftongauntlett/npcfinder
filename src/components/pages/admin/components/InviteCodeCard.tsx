import React from "react";
import { motion } from "framer-motion";
import { Copy, Trash2 } from "lucide-react";
import Card from "../../../shared/ui/Card";
import Chip from "../../../shared/ui/Chip";
import Button from "../../../shared/ui/Button";
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
  isNewlyCreated,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        spacing="sm"
        className={`${
          isNewlyCreated ? "ring-2 ring-green-500 dark:ring-green-400" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <code className="text-base font-mono font-semibold text-gray-900 dark:text-white">
              {code.code}
            </code>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              For: {code.intended_email || "Any"}
            </span>
            <Chip variant="success" size="sm" rounded="full">
              Sent
            </Chip>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="subtle"
              size="icon"
              onClick={() => onCopyCode(code.code)}
              aria-label="Copy invite code"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="subtle"
              size="icon"
              onClick={() => onRevoke(code.id, code.code)}
              aria-label="Delete invite code"
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default InviteCodeCard;
