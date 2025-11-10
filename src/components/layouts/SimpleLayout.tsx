import React from "react";

interface SimpleLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SimpleLayout - Minimal layout for pages without headers/tabs
 * Used by: Dashboard, simple content pages
 */
const SimpleLayout: React.FC<SimpleLayoutProps> = ({
  children,
  className = "",
}) => {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`min-h-screen flex flex-col focus:outline-none ${className}`}
      role="main"
    >
      <div className="container mx-auto px-6 py-12 flex-1 flex flex-col">
        {children}
      </div>
    </main>
  );
};

export default SimpleLayout;
