import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  LogOut,
  FlaskConical,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";
import WeatherWidget from "./shared/WeatherWidget";
import { signOut } from "../lib/auth";
import { isAdmin } from "../lib/admin";
import { getUserProfile } from "../lib/profiles";
import { VIEWS } from "../utils/constants";

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDropdownOpen: false,
      displayName: null,
    };
    this.dropdownRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
    this.loadUserProfile();
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUser?.id !== this.props.currentUser?.id) {
      this.loadUserProfile();
    }
  }

  loadUserProfile = async () => {
    const { currentUser } = this.props;
    if (!currentUser) return;

    const { data } = await getUserProfile(currentUser.id);
    this.setState({
      displayName: data?.display_name || currentUser.email || "User",
    });
  };

  handleClickOutside = (event) => {
    if (
      this.dropdownRef.current &&
      !this.dropdownRef.current.contains(event.target)
    ) {
      this.setState({ isDropdownOpen: false });
    }
  };

  toggleDropdown = () => {
    this.setState((prevState) => ({
      isDropdownOpen: !prevState.isDropdownOpen,
    }));
  };

  handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (confirmed) {
      await signOut();
      // The AuthContext will handle the redirect
    }
    this.setState({ isDropdownOpen: false });
  };

  handleMenuItemClick = (view) => {
    const { onViewChange } = this.props;
    this.setState({ isDropdownOpen: false });
    onViewChange(view);
  };

  render() {
    const { onViewChange, currentUser } = this.props;
    const { isDropdownOpen, displayName } = this.state;
    const showAdminButton = currentUser && isAdmin(currentUser.id);

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

            {/* Right side: Weather and Profile Dropdown */}
            <div className="flex items-center gap-4">
              <WeatherWidget />

              {/* Profile Dropdown */}
              <div className="relative" ref={this.dropdownRef}>
                <button
                  onClick={this.toggleDropdown}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Profile menu"
                >
                  <User className="w-5 h-5" />
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 min-w-max bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {displayName}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

                    {/* Settings */}
                    <button
                      onClick={() => this.handleMenuItemClick(VIEWS.SETTINGS)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>

                    {/* Admin (if user is admin) */}
                    {showAdminButton && (
                      <button
                        onClick={() => this.handleMenuItemClick(VIEWS.TEST)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                      >
                        <FlaskConical className="w-4 h-4" />
                        <span>Admin</span>
                      </button>
                    )}

                    {/* Divider */}
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

                    {/* Sign Out */}
                    <button
                      onClick={this.handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
}

Navigation.propTypes = {
  onViewChange: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
};

export default Navigation;
