import React from "react";

interface TabPanelProps {
  id: string;
  tabId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * TabPanel Component
 * 
 * Accessible tab panel that:
 * - Has role="tabpanel"
 * - Has an ID matching the aria-controls attribute of its tab
 * - References its controlling tab via aria-labelledby
 */
const TabPanel: React.FC<TabPanelProps> = ({
  id,
  tabId,
  children,
  className = "",
}) => {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={tabId}
      className={className}
    >
      {children}
    </div>
  );
};

export default TabPanel;
