import React from "react";

/**
 * Development mode indicator badge
 * Only shows in development mode and only for admin users
 */
interface DevIndicatorProps {
  isAdmin: boolean;
}

const DevIndicator: React.FC<DevIndicatorProps> = ({ isAdmin }) => {
  // Only show in dev mode
  if (!import.meta.env.DEV) return null;

  // Only show for admin users
  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 text-xs text-gray-500 dark:text-gray-600 font-mono pointer-events-none">
      <div className="opacity-50 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
        dev
      </div>
    </div>
  );
};

export default DevIndicator;
