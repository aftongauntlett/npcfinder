import React, { Component } from "react";

class DashboardCard extends Component {
  render() {
    const { id, title, description, gradient, isFavorite, onToggleFavorite } =
      this.props;

    return (
      <div
        className={`bg-gradient-to-br ${gradient} backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer`}
      >
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-300 text-sm">{description}</p>
        <div className="flex justify-end mt-4">
          <button onClick={() => onToggleFavorite(id)}>
            {isFavorite ? "❤️" : "🤍"}
          </button>
        </div>
      </div>
    );
  }
}

export default DashboardCard;
