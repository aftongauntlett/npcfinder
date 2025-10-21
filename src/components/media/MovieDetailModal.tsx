import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Calendar,
  Clock,
  Users,
  Film,
  Tv,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import {
  fetchDetailedMediaInfo,
  DetailedMediaInfo,
} from "../../utils/tmdbDetails";
import type { WatchlistItem } from "../../services/recommendationsService";

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem;
  onToggleWatched: (id: string) => void;
  onRemove: (id: string) => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onToggleWatched,
  onRemove,
}) => {
  const [details, setDetails] = useState<DetailedMediaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed information when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const detailedInfo = await fetchDetailedMediaInfo(
          item.external_id,
          item.media_type
        );
        if (detailedInfo) {
          setDetails(detailedInfo);
        } else {
          setError("Could not load details");
        }
      } catch (err) {
        console.error("Error loading movie details:", err);
        setError("Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [isOpen, item.external_id, item.media_type]);

  const MediaIcon = item.media_type === "tv" ? Tv : Film;
  const releaseYear = item.release_date
    ? new Date(item.release_date).getFullYear()
    : null;

  const handleToggleWatched = () => {
    void onToggleWatched(item.id);
  };

  const handleRemove = () => {
    if (window.confirm(`Remove "${item.title}" from your watch list?`)) {
      void onRemove(item.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
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
        {loading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading details...
            </p>
          </div>
        ) : error ? (
          // Error State
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        ) : (
          // Main Content
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Poster */}
              <div className="flex-shrink-0">
                {item.poster_url ? (
                  <img
                    src={item.poster_url.replace("w200", "w500")}
                    alt={item.title}
                    className="w-full sm:w-48 h-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full sm:w-48 h-72 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <MediaIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              {/* Title and Basic Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2
                      id="modal-title"
                      className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2"
                    >
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      {releaseYear && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{releaseYear}</span>
                        </div>
                      )}
                      {details?.runtime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{details.runtime} min</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MediaIcon className="w-4 h-4" />
                        <span className="capitalize">{item.media_type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Genres */}
                {details?.genres && details.genres.length > 0 && (
                  <div
                    className="flex flex-wrap gap-2 mb-4"
                    role="list"
                    aria-label="Genres"
                  >
                    {details.genres.map((genre) => (
                      <span
                        key={genre}
                        role="listitem"
                        className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating */}
                {details?.vote_average !== null &&
                  details?.vote_average !== undefined && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Star
                          className="w-5 h-5 text-yellow-500 fill-yellow-500"
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {details.vote_average.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          / 10
                        </span>
                      </div>
                      {details.vote_count && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          ({details.vote_count.toLocaleString()} votes)
                        </span>
                      )}
                    </div>
                  )}

                {/* Director/Creator */}
                {details?.director && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">
                        {item.media_type === "tv" ? "Creator:" : "Director:"}
                      </span>{" "}
                      {details.director}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    onClick={handleToggleWatched}
                    variant={item.watched ? "secondary" : "primary"}
                    icon={
                      item.watched ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )
                    }
                  >
                    Mark as {item.watched ? "Unwatched" : "Watched"}
                  </Button>
                  <Button onClick={handleRemove} variant="danger">
                    Remove from List
                  </Button>
                </div>
              </div>
            </div>

            {/* Overview */}
            {(details?.overview || item.overview) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Overview
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {details?.overview || item.overview}
                </p>
              </div>
            )}

            {/* Cast */}
            {details?.cast && details.cast.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5" aria-hidden="true" />
                  Cast
                </h3>
                <div className="flex flex-wrap gap-2" role="list">
                  {details.cast.map((actor, index) => (
                    <span
                      key={index}
                      role="listitem"
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Awards */}
            {details?.awards && details.awards.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Recognition
                </h3>
                <div className="flex flex-wrap gap-2" role="list">
                  {details.awards.map((award, index) => (
                    <span
                      key={index}
                      role="listitem"
                      className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium"
                    >
                      {award}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Added Date */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Added to your list on{" "}
                {new Date(item.added_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MovieDetailModal;
