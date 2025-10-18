import React from "react";

interface DashboardHeaderProps {
  displayName?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ displayName }) => {
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
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
        {greeting}, {name}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
        Your personal dashboard for everything that matters
      </p>
    </div>
  );
};

export default DashboardHeader;
