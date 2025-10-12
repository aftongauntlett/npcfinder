import React, { Component } from "react";

class DashboardCard extends Component {
  render() {
    const { title, description, gradient } = this.props;

    return (
      <div
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

export default DashboardCard;
