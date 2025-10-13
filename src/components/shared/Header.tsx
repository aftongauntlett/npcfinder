import React, { useEffect, useState } from "react";

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        NPC Finder
      </h1>
      <time
        className="text-sm bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
        dateTime={new Date().toISOString()}
      >
        {currentTime}
      </time>
    </header>
  );
};

export default Header;
