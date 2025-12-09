import React from "react";
import { motion } from "framer-motion";
import { Shield, ShieldPlus, User as UserIcon } from "lucide-react";
import Card from "../../../shared/ui/Card";
import Chip from "../../../shared/ui/Chip";
import UserRoleBadge from "./UserRoleBadge";
import type { UserRole } from "../../../../contexts/AdminContext";

const UserRoleIcon: React.FC<{ role: UserRole }> = ({ role }) => {
  const getIconAndColor = () => {
    if (role === "super_admin") {
      return {
        icon: <ShieldPlus className="w-5 h-5" />,
        gradient: "from-yellow-600 to-amber-700",
      };
    }
    if (role === "admin") {
      return {
        icon: <Shield className="w-5 h-5" />,
        gradient: "from-green-500 to-emerald-600",
      };
    }
    return {
      icon: <UserIcon className="w-5 h-5" />,
      gradient: "from-green-500 to-emerald-600",
    };
  };

  const { icon, gradient } = getIconAndColor();

  return (
    <motion.div
      className={`flex-shrink-0 h-12 w-12 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white`}
      whileHover={{ rotate: 5 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
    >
      {icon}
    </motion.div>
  );
};

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
      <Card
        spacing="sm"
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <UserRoleIcon role={user.role} />
          <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.display_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email || "N/A"}
              </div>
            </div>
            <Chip variant="default" size="sm" rounded="full">
              {new Date(user.created_at).toLocaleDateString()}
            </Chip>
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
