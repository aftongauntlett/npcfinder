import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import Footer from "./components/shared/Footer";
import DashboardCard from "./components/dashboard/DashboardCard";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import Navigation from "./components/Navigation";
import MoviesTV from "./components/pages/MoviesTV";
import Music from "./components/pages/Music";
import AuthPage from "./components/pages/AuthPage";
import AdminPanel from "./components/pages/AdminPanel";
import UserSettings from "./components/pages/UserSettings";
import Suggestions from "./components/pages/Suggestions";
import StarryBackground from "./components/StarryBackground";
import DemoLanding from "./components/pages/DemoLanding";
import PageContainer from "./components/layouts/PageContainer";
import DevIndicator from "./components/dev/DevIndicator";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider, useAdmin } from "./contexts/AdminContext";
import { getUserProfile } from "./lib/profiles";
import { cards } from "./data/dashboardCards";
import { useTheme } from "./hooks/useTheme";

// Home page component
interface HomePageProps {
  user: User;
}

const HomePage: React.FC<HomePageProps> = ({ user }) => {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [visibleCards, setVisibleCards] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { changeThemeColor } = useTheme();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await getUserProfile(user.id);
        setDisplayName(data?.display_name || null);

        // If user has card preferences, use them. Otherwise show all cards
        const allCardIds = cards.map((c) => c.cardId);
        setVisibleCards(data?.visible_cards || allCardIds);

        // Load and apply user's theme color
        if (data?.theme_color) {
          changeThemeColor(data.theme_color);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        // Default to showing all cards
        setVisibleCards(cards.map((c) => c.cardId));
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user.id, changeThemeColor]);

  // Filter cards based on user preferences
  const filteredCards = cards.filter((card) =>
    visibleCards.includes(card.cardId)
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
      <Footer />
    </main>
  );
};

// Protected Route wrapper for admin routes
interface ProtectedAdminRouteProps {
  user: User;
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  user,
  children,
}) => {
  const { isAdmin, isLoading } = useAdmin();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Access Denied - Admin Only</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Main App Layout (authenticated users)
interface AppLayoutProps {
  user: User;
}

const AppLayout: React.FC<AppLayoutProps> = ({ user }) => {
  const { isAdmin: userIsAdmin } = useAdmin();

  return (
    <PageContainer className="relative">
      <StarryBackground />
      <Navigation currentUser={user} />
      <DevIndicator isAdmin={userIsAdmin} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/movies-tv" element={<MoviesTV />} />
        <Route path="/music" element={<Music />} />
        <Route path="/settings" element={<UserSettings currentUser={user} />} />
        <Route
          path="/suggestions"
          element={<Suggestions currentUser={user} />}
        />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute user={user}>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />
        {/* Catch all - redirect to app home */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </PageContainer>
  );
};

// Authenticated App Wrapper
const AuthenticatedApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    void import("./lib/auth").then(({ getCurrentUser, onAuthStateChange }) => {
      void getCurrentUser()
        .then(({ data: currentUser }) => {
          setUser(currentUser);
          setAuthLoading(false);
        })
        .catch((error) => {
          console.error("Failed to get current user:", error);
          setAuthLoading(false);
        });

      const { data: authListener } = onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    });
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public landing page - always accessible */}
      <Route path="/" element={<DemoLanding />} />

      {/* Login/Signup page (invite-only) */}
      <Route
        path="/login"
        element={user ? <Navigate to="/app" replace /> : <AuthPage />}
      />

      {/* Protected app routes */}
      <Route
        path="/app/*"
        element={
          user ? <AppLayout user={user} /> : <Navigate to="/login" replace />
        }
      />

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AdminProvider>
            <AuthenticatedApp />
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
