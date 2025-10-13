import React, { Component } from "react";
import Footer from "./components/shared/Footer";
import DashboardCard from "./components/Dashboard/DashboardCard";
import Hero from "./components/Hero";
import Navigation from "./components/Navigation";
import FitnessDashboard from "./components/FitnessDashboard";
import StarryBackground from "./components/StarryBackground";
import PageContainer from "./components/shared/PageContainer";
import { ThemeProvider } from "./contexts/ThemeContext";
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
        <PageContainer className="relative">
          <StarryBackground />
          <Navigation onViewChange={this.handleViewChange} />
          {this.renderCurrentView()}
        </PageContainer>
      </ThemeProvider>
    );
  }
}

export default App;
