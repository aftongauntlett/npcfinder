import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout - Base layout for all authenticated pages
 * Provides proper spacing for sidebar and ensures consistent layout
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen transition-all duration-300">
      {/* Main content area with sidebar spacing */}
      <div className="pl-16 md:pl-64 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
