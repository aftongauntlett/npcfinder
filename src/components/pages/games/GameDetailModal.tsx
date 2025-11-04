import React, { useState } from "react";
import { X, Star, Gamepad2, Calendar, DollarSign, Award } from "lucide-react";
import Modal from "../../shared/Modal";
import Button from "../../shared/Button";
import { getGenreColor } from "../../../utils/genreColors";
import type { GameLibraryItem } from "../../../hooks/useGameLibraryQueries";
import { useUpdateGameRating } from "../../../hooks/useGameLibraryQueries";

interface GameDetailModalProps {
  game: GameLibraryItem;
  onClose: () => void;
  onTogglePlayed: () => void;
  onRemove: () => void;
  onRecommend: () => void;
}

const GameDetailModal: React.FC<GameDetailModalProps> = ({
  game,
  onClose,
  onTogglePlayed,
  onRemove,
  onRecommend,
}) => {
  const [rating, setRating] = useState(game.personal_rating || 0);
  const [hoveredStar, setHoveredStar] = useState(0);

  const updateRating = useUpdateGameRating();

  const handleRatingClick = (newRating: number) => {
    setRating(newRating);
    void updateRating.mutateAsync({ gameId: game.id, rating: newRating });
  };

  const releaseYear = game.released
    ? new Date(game.released).getFullYear()
    : null;

  // Parse genres from comma-separated string
  const genreList = game.genres
    ? game.genres.split(",").map((g: string) => g.trim())
    : [];

  // Parse platforms from comma-separated string
  const platformList = game.platforms
    ? game.platforms.split(",").map((p: string) => p.trim())
    : [];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="4xl"
      showHeader={false}
      closeOnBackdropClick={true}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Content */}
      <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Game Cover */}
            <div className="flex-shrink-0">
              {game.background_image ? (
                <img
                  src={game.background_image}
                  alt={`${game.name} cover`}
                  className="w-full sm:w-56 h-auto rounded-lg shadow-xl transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full sm:w-56 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-xl">
                  <Gamepad2 className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            {/* Vertical Divider (hidden on mobile) */}
            <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

            {/* Title and Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {game.name}
                </h2>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {releaseYear && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{releaseYear}</span>
                    </div>
                  )}
                  {game.playtime && (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>{game.playtime}h avg playtime</span>
                    </div>
                  )}
                  {game.metacritic && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span>Metacritic: {game.metacritic}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {genreList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4" role="list">
                    {genreList.map((genre: string) => (
                      <span
                        key={genre}
                        role="listitem"
                        className={`px-3 py-1.5 text-xs font-medium rounded-full ${getGenreColor(
                          genre.toLowerCase()
                        )}`}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Platforms */}
                {platformList.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Platforms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {platformList.map((platform: string) => (
                        <span
                          key={platform}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div>
                {game.played ? (
                  <span className="inline-flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    <Award className="w-4 h-4 mr-1.5" />
                    Played
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                    <Gamepad2 className="w-4 h-4 mr-1.5" />
                    Playing
                  </span>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoveredStar || rating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* RAWG Rating */}
              {game.rating && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    RAWG Rating:{" "}
                  </span>
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {game.rating.toFixed(1)}/5
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={onTogglePlayed}
                  variant={game.played ? "secondary" : "primary"}
                  size="sm"
                >
                  {game.played ? "Mark as Playing" : "Mark as Played"}
                </Button>
                <Button onClick={onRecommend} variant="secondary" size="sm">
                  Recommend
                </Button>
                <Button onClick={onRemove} variant="danger" size="sm">
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* TODO: Add GameReviewForm accordion here */}
        </div>
      </div>
    </Modal>
  );
};

export default GameDetailModal;
