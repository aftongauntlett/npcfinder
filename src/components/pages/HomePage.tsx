import React, { useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import DashboardCard from "../dashboard/DashboardCard";
import DashboardHeader from "../dashboard/DashboardHeader";
import Footer from "../shared/Footer";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { cards } from "../../data/dashboardCards";
import { useTheme } from "../../hooks/useTheme";

interface HomePageProps {
  user: User;
}

const HomePage: React.FC<HomePageProps> = () => {
  const { changeThemeColor } = useTheme();

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

  // If user has card preferences, use them. Otherwise show all cards
  const allCardIds = cards.map((c) => c.cardId);
  const visibleCards = profile?.visible_cards || allCardIds;

  // Filter cards based on user preferences
  const filteredCards = useMemo(
    () => cards.filter((card) => visibleCards.includes(card.cardId)),
    [visibleCards]
  );

  if (isLoading) {
    return (
      <main className="container mx-auto px-6 py-12">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Loading your dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 py-12">
      {/* Greeting Header */}
      <DashboardHeader displayName={displayName || undefined} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => (
          <DashboardCard
            key={card.id}
            title={card.title}
            description={card.description}
            gradient={card.gradient}
            route={card.route}
          />
        ))}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default HomePage;
