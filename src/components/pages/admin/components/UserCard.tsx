import React from "react";
import { motion } from "framer-motion";
import Card from "../../../shared/ui/Card";
import UserRoleBadge from "./UserRoleBadge";
import type { UserRole } from "../../../../contexts/AdminContext";

interface User {
  id: string;
  display_name: string;
  email?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface UserCardProps {
  user: User;
  onToggleRole: (user: User) => void;
  canDemoteUser: (user: User) => boolean;
  isSuperAdmin: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onToggleRole,
  canDemoteUser,
  isSuperAdmin,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card spacing="md" className="space-y-3">
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

        <div className="flex items-start sm:items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
          <div className="flex-shrink-0">
            <UserRoleBadge
              role={user.role}
              onClick={
                canDemoteUser(user) ? () => onToggleRole(user) : undefined
              }
              disabled={
                !canDemoteUser(user) || (user.role === "admin" && !isSuperAdmin)
              }
              disabledReason={
                user.role === "admin" && !isSuperAdmin
                  ? "Only super admin can demote admins"
                  : undefined
              }
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default UserCard;
