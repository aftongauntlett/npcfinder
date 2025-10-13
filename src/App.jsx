import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Footer from "./components/shared/Footer";
import DashboardCard from "./components/Dashboard/DashboardCard";
import Hero from "./components/Hero";
import Navigation from "./components/Navigation";
import FitnessDashboard from "./components/FitnessDashboard";
import MoviesTV from "./components/MoviesTV";
import AuthPage from "./components/AuthPage";
import AdminPanel from "./components/AdminPanel";
import UserSettings from "./components/UserSettings";
import Suggestions from "./components/Suggestions";
import StarryBackground from "./components/StarryBackground";
import PageContainer from "./components/shared/PageContainer";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { isAdmin } from "./lib/admin";
import { cards } from "./data/dashboardCards";

// Home page component
const HomePage = () => (
  <main className="container mx-auto px-6 py-12">
    <Hero />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {cards.map((card) => (
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

// Protected Route wrapper for admin routes
const ProtectedAdminRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin(user.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Access Denied - Admin Only</div>
      </div>
    );
  }

  return children;
};

// Main App Layout (authenticated users)
const AppLayout = ({ user }) => {
  return (
    <PageContainer className="relative">
      <StarryBackground />
      <Navigation currentUser={user} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fitness" element={<FitnessDashboard />} />
        <Route path="/movies-tv" element={<MoviesTV />} />
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
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageContainer>
  );
};

// Authenticated App Wrapper
const AuthenticatedApp = () => {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    import("./lib/auth").then(({ getCurrentUser, onAuthStateChange }) => {
      getCurrentUser().then(({ user: currentUser }) => {
        setUser(currentUser);
        setAuthLoading(false);
      });

      const { data: authListener } = onAuthStateChange((event, session) => {
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

  if (!user) {
    return <AuthPage />;
  }

  return <AppLayout user={user} />;
};

// Main App component
const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
