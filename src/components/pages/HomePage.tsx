import React, { useState } from "react";
import type { User } from "@supabase/supabase-js";
import DashboardHeader from "../dashboard/DashboardHeader";
import Footer from "../shared/Footer";
import MainLayout from "../layouts/MainLayout";
import SimpleLayout from "../layouts/SimpleLayout";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { useTheme } from "../../hooks/useTheme";
import { TrendingUp, Users, Star, X } from "lucide-react";

interface HomePageProps {
  user: User;
}

const HomePage: React.FC<HomePageProps> = () => {
  const { changeThemeColor } = useTheme();
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return localStorage.getItem("hideGettingStarted") !== "true";
  });

  // Fetch user profile with TanStack Query (automatic caching, shared with Navigation)
  const { data: profile, isLoading } = useProfileQuery();

  // Apply theme color when profile loads
  const themeColorApplied = React.useRef(false);
  React.useEffect(() => {
    if (profile?.theme_color && !themeColorApplied.current) {
      changeThemeColor(profile.theme_color);
      themeColorApplied.current = true;
    }
  }, [profile?.theme_color, changeThemeColor]);

  const displayName = profile?.display_name || null;

  if (isLoading) {
    return (
      <MainLayout>
        <SimpleLayout>
          <div className="text-center text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </div>
        </SimpleLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SimpleLayout>
        <div className="flex-1">
          {/* Greeting Header */}
          <DashboardHeader displayName={displayName || undefined} />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Star className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white font-heading">
                  Your Ratings
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white font-heading">
                0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Start rating content you enjoy
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white font-heading">
                  Friends
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white font-heading">
                0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Connect with friends to share
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white font-heading">
                  Recommendations
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white font-heading">
                Coming Soon
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Get personalized suggestions
              </p>
            </div>
          </div>

          {/* Getting Started */}
          {showGettingStarted && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 relative">
              <button
                onClick={() => {
                  setShowGettingStarted(false);
                  localStorage.setItem("hideGettingStarted", "true");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 p-1"
                aria-label="Dismiss getting started"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pr-8 font-heading">
                Getting Started
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary dark:text-primary-light font-bold mt-0.5">
                    1.
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Start tracking content
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browse Movies & TV, Music, Books, or Games and add items
                      to your watchlist
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary dark:text-primary-light font-bold mt-0.5">
                    2.
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Rate what you've enjoyed
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Give ratings to help us understand your taste
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary dark:text-primary-light font-bold mt-0.5">
                    3.
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Connect with friends
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      See what your friends are watching and get recommendations
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </SimpleLayout>
    </MainLayout>
  );
};

export default HomePage;
