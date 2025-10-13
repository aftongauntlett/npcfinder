import React, { Component } from "react";
import PropTypes from "prop-types";
import { LogOut } from "lucide-react";
import WeatherWidget from "./shared/WeatherWidget";
import { signOut } from "../lib/auth";

class Navigation extends Component {
  handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (confirmed) {
      await signOut();
      // The AuthContext will handle the redirect
    }
  };

  render() {
    const { onViewChange } = this.props;

    return (
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side: Title (clickable to go home) */}
            <h1
              onClick={() => onViewChange("home")}
              className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors"
            >
              NPC Finder
            </h1>

            {/* Right side: Weather and Logout */}
            <div className="flex items-center gap-4">
              <WeatherWidget />
              <button
                onClick={this.handleLogout}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
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
