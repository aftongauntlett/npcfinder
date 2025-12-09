import React from "react";

interface SkeletonCardProps {
  variant?: "default" | "stat" | "settings";
  className?: string;
}

/**
 * Skeleton loading placeholder to prevent layout shift
 * Reserves space while content loads
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = "default",
  className = "",
}) => {
  if (variant === "stat") {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-1"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </div>
    );
  }

  if (variant === "settings") {
    return (
      <div
        className={`bg-white/5 dark:bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-8 animate-pulse ${className}`}
      >
        <div className="space-y-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse ${className}`}
    >
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
    </div>
  );
};

export default SkeletonCard;
