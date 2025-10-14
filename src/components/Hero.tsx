import React from "react";

const Hero: React.FC = () => {
  return (
    <header className="text-center mb-12">
      <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
        Welcome to Your Personal Dashboard
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
        Your one-stop shop for entertainment, music, games, restaurants, and
        memories. Curated just for you.
      </p>
    </header>
  );
};

export default Hero;
