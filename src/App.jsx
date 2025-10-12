import React, { Component } from "react";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import DashboardCard from "./components/Dashboard/DashboardCard";
import Hero from "./components/Hero";
import Navigation from "./components/Navigation";
import FitnessDashboard from "./components/FitnessDashboard";
import Settings from "./components/Settings";
import StarryBackground from "./components/StarryBackground";
import { ThemeProvider } from "./contexts/ThemeContext";
import { cards } from "./data/dashboardCards";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      currentView: "home",
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

  renderCurrentView() {
    const { currentView } = this.state;

    switch (currentView) {
      case "home":
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="container mx-auto px-6 py-12">
              <Hero />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {cards.map((card) => (
                  <DashboardCard
                    key={card.id}
                    title={card.title}
                    description={card.description}
                    gradient={card.gradient}
                  />
                ))}
              </div>
              <Footer />
            </main>
          </div>
        );
      case "fitness":
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <FitnessDashboard />
          </div>
        );
      case "settings":
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Settings />
          </div>
        );
      default:
        return null;
    }
  }

  render() {
    const { isLoading, currentView } = this.state;

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          <StarryBackground />
          <Navigation
            currentView={currentView}
            onViewChange={this.handleViewChange}
          />
          {this.renderCurrentView()}
        </div>
      </ThemeProvider>
    );
  }
}

export default App;
