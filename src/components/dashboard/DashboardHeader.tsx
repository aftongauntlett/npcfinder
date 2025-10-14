import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";

interface DashboardHeaderProps {
  displayName?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ displayName }) => {
  const navigate = useNavigate();

  // Get time-based greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();
  const name = displayName || "there";

  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {greeting}, {name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
          Your personal dashboard for everything that matters
        </p>
      </div>

      {/* Customize button */}
      <button
        onClick={() => void navigate("/app/settings")}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary bg-primary-pale/10 dark:bg-primary-pale/10 hover:bg-primary-pale/20 dark:hover:bg-primary-pale/15 rounded-lg transition-colors"
        aria-label="Customize dashboard"
      >
        <Settings className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Customize</span>
      </button>
    </div>
  );
};

export default DashboardHeader;
