import React from "react";
import { useSidebar } from "../../contexts/SidebarContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout - Base layout for all authenticated pages
 * Provides proper spacing for sidebar and ensures consistent layout
 * Responds to sidebar collapse/expand state
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen transition-all duration-300">
      {/* Main content area with responsive sidebar spacing */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "pl-16" : "pl-16 md:pl-64"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
