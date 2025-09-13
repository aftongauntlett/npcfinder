import React, { Component } from "react";

// Starting with a class component to demonstrate traditional React patterns
// We'll refactor this to a functional component later to show modern approaches
// Production deployment trigger
class App extends Component {
  constructor(props) {
    super(props);

    // State in class components is defined in constructor
    this.state = {
      currentTime: new Date().toLocaleTimeString(),
      isLoading: true,
    };
  }

  // Class component lifecycle method
  componentDidMount() {
    // Simulate loading and set up time updates
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 1000);

    // Update time every second
    this.timeInterval = setInterval(() => {
      this.setState({
        currentTime: new Date().toLocaleTimeString(),
      });
    }, 1000);
  }

  // Cleanup when component unmounts
  componentWillUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  render() {
    const { currentTime, isLoading } = this.state;

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
        {/* Header with time */}
        <header className="flex justify-between items-center p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
            NPC Finder
          </h1>
          <div className="text-sm bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
            {currentTime}
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Welcome to Your Personal Dashboard
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Your one-stop shop for movies, music, games, restaurants, and
              memories. Curated just for you, with that nostalgic web feel you
              love.
            </p>
          </div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Movies Card */}
            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Movies</h3>
              <p className="text-gray-300 text-sm">
                Track what you've watched, rate favorites, and discover new
                films
              </p>
            </div>

            {/* Music Card */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Music</h3>
              <p className="text-gray-300 text-sm">
                Your personal soundtrack library and discovery zone
              </p>
            </div>

            {/* Games Card */}
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Games</h3>
              <p className="text-gray-300 text-sm">
                Gaming backlog, reviews, and achievement tracking
              </p>
            </div>

            {/* TV Shows Card */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">TV Shows</h3>
              <p className="text-gray-300 text-sm">
                Binge lists, episode tracking, and series discoveries
              </p>
            </div>

            {/* Restaurants Card */}
            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Food & Places</h3>
              <p className="text-gray-300 text-sm">
                Restaurant reviews, travel spots, and culinary adventures
              </p>
            </div>

            {/* Journal Card */}
            <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Journal</h3>
              <p className="text-gray-300 text-sm">
                Daily thoughts, memories, and creative expressions
              </p>
            </div>
          </div>

          {/* Coming soon section */}
          <div className="text-center mt-16">
            <p className="text-gray-400 text-sm">
              Built with ✨ by Afton Gauntlett • {""}
              <a
                href="https://aftongauntlett.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline transition-colors duration-200"
              >
                View Portfolio
              </a>
            </p>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
