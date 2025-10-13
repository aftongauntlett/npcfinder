import React, { Component } from "react";
import PropTypes from "prop-types";
import WeatherWidget from "./shared/WeatherWidget";

class Navigation extends Component {
  render() {
    const { onViewChange } = this.props;

    return (
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side: Title (clickable to go home) */}
            <h1
              onClick={() => onViewChange("home")}
              className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer"
            >
              NPC Finder
            </h1>

            {/* Right side: Weather */}
            <WeatherWidget />
          </div>
        </div>
      </nav>
    );
  }
}

Navigation.propTypes = {
  onViewChange: PropTypes.func.isRequired,
};

export default Navigation;
