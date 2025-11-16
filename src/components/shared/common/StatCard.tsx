import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
  valueColor?: string;
}

/**
 * Reusable StatCard Component
 * Matches the styling from InviteCodeManager for consistency
 */
const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  iconColor = "text-blue-400",
  valueColor = "text-white dark:text-white",
}) => {
  return (
    <div className="bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 dark:text-gray-400 text-sm mb-1">
            {label}
          </p>
          <p className={`text-2xl sm:text-3xl font-bold ${valueColor}`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <Icon
          className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 ${iconColor}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default React.memo(StatCard);
