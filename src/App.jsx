import React, { Component } from "react";
import Footer from "./components/shared/Footer";
import DashboardCard from "./components/Dashboard/DashboardCard";
import Hero from "./components/Hero";
import Navigation from "./components/Navigation";
import FitnessDashboard from "./components/FitnessDashboard";
import MoviesTV from "./components/MoviesTV";
import AuthPage from "./components/AuthPage";
import StarryBackground from "./components/StarryBackground";
import PageContainer from "./components/shared/PageContainer";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { cards } from "./data/dashboardCards";
import { VIEWS } from "./utils/constants";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      currentView: VIEWS.HOME,
    };
  }

  componentDidMount() {
    this.setState({
      isLoading: false,
    });
  }

  handleViewChange = (view) => {
    this.setState({ currentView: view });
  };

  handleCardClick = (cardTitle) => {
    // Convert card title to view name
    if (cardTitle === "Fitness") {
      this.setState({ currentView: VIEWS.FITNESS });
    } else if (cardTitle === "Movies & TV") {
      this.setState({ currentView: VIEWS.MOVIES_TV });
    }
    // Add more card handlers here as needed
  };

  renderCurrentView() {
    const { currentView } = this.state;

    switch (currentView) {
      case VIEWS.HOME:
        return (
          <PageContainer>
            <main className="container mx-auto px-6 py-12">
              <Hero />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {cards.map((card) => (
                  <DashboardCard
                    key={card.id}
                    title={card.title}
                    description={card.description}
                    gradient={card.gradient}
                    onClick={() => this.handleCardClick(card.title)}
                  />
                ))}
              </div>
              <Footer />
            </main>
          </PageContainer>
        );
      case VIEWS.FITNESS:
        return (
          <PageContainer>
            <FitnessDashboard />
          </PageContainer>
        );
      case VIEWS.MOVIES_TV:
        return (
          <PageContainer>
            <MoviesTV />
          </PageContainer>
        );
      default:
        return null;
    }
  }

  render() {
    const { isLoading } = this.state;

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-white text-2xl animate-pulse">
            Loading your personal dashboard...
          </div>
        </div>
      );
    }

    return (
      <ThemeProvider>
        <AuthProvider>
          <AuthenticatedApp
            currentView={this.state.currentView}
            onViewChange={this.handleViewChange}
            onCardClick={this.handleCardClick}
            renderCurrentView={() => this.renderCurrentView()}
          />
        </AuthProvider>
      </ThemeProvider>
    );
  }
}

// Wrapper component to access auth context
const AuthenticatedApp = ({ renderCurrentView, onViewChange }) => {
  // We'll use a functional component here to access the auth context
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    // Import inside useEffect to avoid circular dependency
    import("./lib/auth").then(({ getCurrentUser, onAuthStateChange }) => {
      // Check current user
      getCurrentUser().then(({ user: currentUser }) => {
        setUser(currentUser);
        setAuthLoading(false);
      });

      // Listen for auth changes
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

  // If no user, show login page
  if (!user) {
    return <AuthPage />;
  }

  // If user is logged in, show the app
  return (
    <PageContainer className="relative">
      <StarryBackground />
      <Navigation onViewChange={onViewChange} />
      {renderCurrentView()}
    </PageContainer>
  );
};

export default App;
