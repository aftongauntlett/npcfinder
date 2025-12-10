import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
}) => {
  // Initialize with safe defaults (no window/localStorage access during render)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Hydrate persisted state and initial viewport detection on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Check localStorage for persisted state
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      } else {
        // Default: collapsed on mobile, expanded on desktop
        setIsCollapsed(mobile);
      }
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
    }
  }, [isCollapsed]);

  // Track mobile viewport and auto-collapse (stable listener, no re-attachment)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Use functional update to derive latest isCollapsed without dependency
      if (mobile) {
        setIsCollapsed((currentCollapsed) => {
          if (!currentCollapsed) {
            return true;
          }
          return currentCollapsed;
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, isMobile, toggleSidebar, setIsCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
