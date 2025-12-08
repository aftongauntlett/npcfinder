import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Button from "../../../shared/ui/Button";
import InviteCodeStatusBadge from "./InviteCodeStatusBadge";
import type { InviteCode } from "../../../../lib/inviteCodes";

interface InviteCodeTableProps {
  codes: InviteCode[];
  onRevoke: (id: string, code: string) => void;
  onCopyCode: (code: string) => void;
  onCopyWithMessage: (code: string) => void;
  copiedCode: string | null;
  newlyCreatedCodes: Set<string>;
}

const InviteCodeTable: React.FC<InviteCodeTableProps> = ({
  codes,
  onRevoke,
  onCopyCode,
  onCopyWithMessage,
  copiedCode,
  newlyCreatedCodes,
}) => {
  return (
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
                <InviteCodeStatusBadge code={code} />
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
                      onClick={() => onCopyCode(code.code)}
                      variant="subtle"
                      size="sm"
                    >
                      {copiedCode === code.code ? "Copied!" : "Copy"}
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
                      onClick={() => onCopyWithMessage(code.code)}
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
                      onClick={() => onRevoke(code.id, code.code)}
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
  );
};

export default InviteCodeTable;
