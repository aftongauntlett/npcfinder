import React, { Component } from "react";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import DashboardCard from "./components/Dashboard/DashboardCard";
import Hero from "./components/Hero";
import { cards } from "./data/dashboardCards";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      favorites: [],
    };
  }

  componentDidMount() {
    const savedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    this.setState({ favorites: savedFavorites });

    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 1000);
  }

  componentDidUpdate(_, prevState) {
    if (prevState.favorites !== this.state.favorites) {
      localStorage.setItem("favorites", JSON.stringify(this.state.favorites));
    }
  }

  handleToggleFavorite = (id) => {
    this.setState((prevState) => {
      const isAlreadyFavorite = prevState.favorites.includes(id);

      return {
        favorites: isAlreadyFavorite
          ? prevState.favorites.filter((favId) => favId !== id)
          : [...prevState.favorites, id],
      };
    });
  };

  render() {
    const { isLoading, favorites } = this.state;

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <Header />
        <main className="container mx-auto px-6 py-12">
          <Hero />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {cards.map((card) => (
              <DashboardCard
                key={card.id}
                id={card.id}
                title={card.title}
                description={card.description}
                gradient={card.gradient}
                isFavorite={favorites.includes(card.id)}
                onToggleFavorite={this.handleToggleFavorite}
              />
            ))}
          </div>

          <Footer />
        </main>
      </div>
    );
  }
}

export default App;
