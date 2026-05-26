import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout - Base layout for all authenticated pages
 * Provides a stable page wrapper under the global top navigation
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return <div className="min-h-screen">{children}</div>;
};

export default MainLayout;
