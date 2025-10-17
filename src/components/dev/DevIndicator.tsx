import React from "react";
import { USE_MOCK_DATA } from "../../services/config";

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
    <div className="fixed bottom-2 left-2 z-40 text-xs text-gray-500 dark:text-gray-600 font-mono">
      <div className="opacity-50">
        dev {USE_MOCK_DATA ? "• mock" : "• live"}
      </div>
    </div>
  );
};

export default DevIndicator;
