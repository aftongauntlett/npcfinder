import React from "react";
import { motion } from "framer-motion";
import { Shield, ShieldPlus, User as UserIcon } from "lucide-react";
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
      className={`flex-shrink-0 h-10 w-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white`}
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

interface UserTableProps {
  users: User[];
  onToggleRole: (user: User) => void;
  canDemoteUser: (user: User) => boolean;
  isSuperAdmin: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onToggleRole,
  canDemoteUser,
  isSuperAdmin,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Joined
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Admin
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <motion.tr
              key={user.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <UserRoleIcon role={user.role} />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.display_name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email || "N/A"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <UserRoleBadge
                  role={user.role}
                  onClick={
                    canDemoteUser(user) ? () => onToggleRole(user) : undefined
                  }
                  disabled={
                    !canDemoteUser(user) ||
                    (user.role === "admin" && !isSuperAdmin)
                  }
                  disabledReason={
                    user.role === "admin" && !isSuperAdmin
                      ? "Only super admin can demote admins"
                      : undefined
                  }
                />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
