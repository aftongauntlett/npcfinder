import React, { useState, useEffect } from "react";
import { X, Star, Calendar, Clock, Users, ExternalLink } from "lucide-react";
import FocusTrap from "focus-trap-react";
import Button from "../shared/Button";

type MediaStatus = "completed" | "in-progress" | "to-watch" | "dropped";

interface MediaItem {
  title: string;
  poster?: string;
  year?: number;
  runtime?: string;
  description?: string;
  criticScore?: number;
  audienceScore?: number;
  externalUrl?: string;
}

interface FriendRating {
  id: string;
  name: string;
  rating: number;
}

interface MediaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem;
  userRating?: number;
  userStatus?: MediaStatus;
  friendsRatings?: FriendRating[];
  onRatingChange: (rating: number) => void;
  onStatusChange: (status: MediaStatus) => void;
}

const STATUS_OPTIONS: Array<{ value: MediaStatus; label: string }> = [
  { value: "completed", label: "Completed" },
  { value: "in-progress", label: "In Progress" },
  { value: "to-watch", label: "To Watch" },
  { value: "dropped", label: "Dropped" },
];

const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
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

  useEffect(() => {
    // Close modal on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRatingSubmit = () => {
    onRatingChange(localRating);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          escapeDeactivates: false, // We handle ESC manually
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: true,
        }}
      >
        <div
          className="relative w-full max-w-4xl my-8 max-h-[85vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-y-auto focus:outline-none"
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
          <div className="p-6 sm:p-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              {/* Poster */}
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={`${item.title} poster`}
                  className="w-full sm:w-40 h-60 object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full sm:w-40 h-60 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Image</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <h2
                  id="modal-title"
                  className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {item.title}
                </h2>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {item.year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>{item.year}</span>
                    </div>
                  )}
                  {item.runtime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>{item.runtime}</span>
                    </div>
                  )}
                </div>

                {/* External Ratings */}
                <div className="flex flex-wrap gap-4 mb-4">
                  {item.criticScore !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Critics:
                      </span>
                      <span className="font-semibold text-yellow-500">
                        {item.criticScore}%
                      </span>
                    </div>
                  )}
                  {item.audienceScore !== undefined && (
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
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    id="status-label"
                  >
                    Status
                  </label>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-labelledby="status-label"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onStatusChange(option.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          userStatus === option.value
                            ? "bg-primary-contrast"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                        aria-pressed={userStatus === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Input */}
                <div className="mb-4">
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    id="rating-label"
                  >
                    Your Rating
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex gap-1"
                      role="group"
                      aria-labelledby="rating-label"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setLocalRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= (hoveredRating || localRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                            aria-hidden="true"
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
                  <Users className="w-5 h-5" aria-hidden="true" />
                  Friends' Ratings
                </h3>
                <ul className="space-y-2">
                  {friendsRatings.map((friend) => (
                    <li
                      key={friend.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {friend.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex"
                          aria-label={`${friend.name} rated ${friend.rating} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= friend.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {friend.rating}/5
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
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
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm font-medium">
                    View on External Site
                  </span>
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

export default MediaDetailModal;
