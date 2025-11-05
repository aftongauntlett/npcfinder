import React from "react";
import { useSidebar } from "../../contexts/SidebarContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout - Base layout for all authenticated pages
 * Provides proper spacing for sidebar on desktop, full width on mobile
 * Mobile uses top navigation instead of sidebar
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen transition-all duration-300">
      {/* Main content area with responsive sidebar spacing */}
      {/* Mobile: no sidebar (full width), Desktop: sidebar padding */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "md:pl-16" : "md:pl-[224px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
