import React from "react";
import WeatherWidget from "../shared/WeatherWidget";

interface SimpleLayoutProps {
  children: React.ReactNode;
  className?: string;
  showWeather?: boolean;
}

/**
 * SimpleLayout - Minimal layout for pages without headers/tabs
 * Used by: Dashboard, simple content pages
 */
const SimpleLayout: React.FC<SimpleLayoutProps> = ({
  children,
  className = "",
  showWeather = true,
}) => {
  return (
    <main className={`min-h-screen flex flex-col ${className}`} role="main">
      {showWeather && (
        <div className="fixed top-4 right-6 z-50">
          <WeatherWidget />
        </div>
      )}
      <div className="container mx-auto px-6 py-12 flex-1">{children}</div>
    </main>
  );
};

export default SimpleLayout;
