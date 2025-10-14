import React from "react";
import Breadcrumb from "./Breadcrumb";

interface PageContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container component that wraps page content with breadcrumb navigation.
 * Use this for all main content pages (not the dashboard homepage).
 */
const PageContentContainer: React.FC<PageContentContainerProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`container mx-auto px-6 py-8 ${className}`}>
      <Breadcrumb />
      {children}
    </div>
  );
};

export default PageContentContainer;
