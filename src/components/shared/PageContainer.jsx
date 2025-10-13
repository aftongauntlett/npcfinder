import React from "react";
import PropTypes from "prop-types";

/**
 * Reusable page container component
 * Provides consistent background styling for all pages
 */
const PageContainer = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
};

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default PageContainer;
