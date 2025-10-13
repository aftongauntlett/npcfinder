import React, { useState } from "react";
import PropTypes from "prop-types";
import { X, Star, Calendar, Clock, Users, ExternalLink } from "lucide-react";
import Button from "../shared/Button";

/**
 * Detailed view modal for media items
 */
const MediaDetailModal = ({
  isOpen,
  onClose,
  item,
  userRating,
  userStatus,
  friendsRatings,
  onRatingChange,
  onStatusChange,
}) => {
  const [localRating, setLocalRating] = useState(userRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!isOpen) return null;

  const handleRatingSubmit = () => {
    onRatingChange(localRating);
  };

  const statusOptions = [
    { value: "completed", label: "Completed" },
    { value: "in-progress", label: "In Progress" },
    { value: "to-watch", label: "To Watch" },
    { value: "dropped", label: "Dropped" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Header Section */}
          <div className="flex gap-6 mb-6">
            {/* Poster */}
            {item.poster ? (
              <img
                src={item.poster}
                alt={item.title}
                className="w-40 h-60 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-40 h-60 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h2>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {item.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{item.year}</span>
                  </div>
                )}
                {item.runtime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.runtime}</span>
                  </div>
                )}
              </div>

              {/* External Ratings */}
              <div className="flex flex-wrap gap-4 mb-4">
                {item.criticScore && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Critics:
                    </span>
                    <span className="font-semibold text-yellow-500">
                      {item.criticScore}%
                    </span>
                  </div>
                )}
                {item.audienceScore && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Audience:
                    </span>
                    <span className="font-semibold text-blue-500">
                      {item.audienceScore}%
                    </span>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onStatusChange(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        userStatus === option.value
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setLocalRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoveredRating || localRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {localRating !== userRating && (
                    <Button onClick={handleRatingSubmit} size="sm">
                      Save Rating
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Overview
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Friends Ratings */}
          {friendsRatings && friendsRatings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Friends&apos; Ratings
              </h3>
              <div className="space-y-2">
                {friendsRatings.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {friend.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= friend.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {friend.rating}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {item.externalUrl && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">
                  View on External Site
                </span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

MediaDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    poster: PropTypes.string,
    year: PropTypes.number,
    runtime: PropTypes.string,
    description: PropTypes.string,
    criticScore: PropTypes.number,
    audienceScore: PropTypes.number,
    externalUrl: PropTypes.string,
  }).isRequired,
  userRating: PropTypes.number,
  userStatus: PropTypes.string,
  friendsRatings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
    })
  ),
  onRatingChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default MediaDetailModal;
