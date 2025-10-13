import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import SparkleEffect from "../effects/SparkleEffect";

const DashboardCard = ({ title, description, gradient, route }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <SparkleEffect intensity="medium">
      <div
        onClick={handleClick}
        className={`bg-white dark:bg-gray-800 bg-gradient-to-br ${gradient} border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer group`}
      >
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {description}
        </p>
      </div>
    </SparkleEffect>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  gradient: PropTypes.string.isRequired,
  route: PropTypes.string,
};

export default DashboardCard;
