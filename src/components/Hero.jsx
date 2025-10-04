import React, { Component } from "react";

class Hero extends Component {
  render() {
    return (
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Welcome to Your Personal Dashboard
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Your one-stop shop for movies, music, games, restaurants, and
          memories. Curated just for you, with that nostalgic web feel you love.
        </p>
      </div>
    );
  }
}

export default Hero;
