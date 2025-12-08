import React from "react";
import { motion } from "framer-motion";
import { Users, Star, Activity, ShieldCheck } from "lucide-react";
import StatCard from "../../../shared/common/StatCard";

interface AdminStatsSectionProps {
  stats:
    | {
        totalUsers: number;
        newUsersThisWeek: number;
        totalRatings: number;
        totalInviteCodes: number;
      }
    | undefined;
  isLoading: boolean;
}

const AdminStatsSection: React.FC<AdminStatsSectionProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading || !stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          iconColor="text-blue-400"
          valueColor="text-white dark:text-white"
        />
      </motion.div>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <StatCard
          icon={Star}
          label="New This Week"
          value={stats.newUsersThisWeek}
          iconColor="text-yellow-400"
          valueColor="text-yellow-400"
        />
      </motion.div>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <StatCard
          icon={Activity}
          label="Total Ratings"
          value={stats.totalRatings}
          iconColor="text-green-400"
          valueColor="text-green-400"
        />
      </motion.div>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <StatCard
          icon={ShieldCheck}
          label="Invite Codes"
          value={stats.totalInviteCodes}
          iconColor="text-primary"
          valueColor="text-primary"
        />
      </motion.div>
    </div>
  );
};

export default AdminStatsSection;
