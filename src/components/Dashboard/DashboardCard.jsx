import React, { Component } from "react";
import PropTypes from "prop-types";

class DashboardCard extends Component {
  render() {
    const { title, description, gradient, onClick } = this.props;

    return (
      <div
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 bg-gradient-to-br ${gradient} border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
      >
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-primary-dark transition-colors duration-200">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {description}
        </p>
      </div>
    );
  }
}

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  gradient: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default DashboardCard;
