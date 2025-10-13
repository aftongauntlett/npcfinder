import React from "react";
import PropTypes from "prop-types";

/**
 * Reusable card component
 * Provides consistent card styling throughout the app
 */
const Card = ({ children, className = "", padding = "p-6" }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow rounded-lg ${padding} ${className}`}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.string,
};

export default Card;
