import { useState, useEffect } from "react";
import { X, Loader2, Award, DollarSign } from "lucide-react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { MoviePoster } from "./movie/MoviePoster";
import { MovieMetadata } from "./movie/MovieMetadata";
import { MovieRating } from "./movie/MovieRating";
import { MovieCrewInfo } from "./movie/MovieCrewInfo";
import { MovieCastList } from "./movie/MovieCastList";
import { MovieReviewForm } from "./movie/MovieReviewForm";
import { SimilarMoviesCarousel } from "./SimilarMoviesCarousel";
import {
  fetchDetailedMediaInfo,
  DetailedMediaInfo,
  fetchSimilarMedia,
  SimilarMediaItem,
} from "../../utils/tmdbDetails";
import type { WatchlistItem } from "../../services/recommendationsService.types";
import {
  useAddToWatchlist,
  useWatchlist,
} from "../../hooks/useWatchlistQueries";
import {
  useMyMediaReview,
  useFriendsMediaReviews,
  useUpsertMediaReview,
  useDeleteMediaReview,
} from "../../hooks/useSimpleMediaReviews";
import { useAuth } from "../../contexts/AuthContext";
import { getGenreColor } from "../../utils/genreColors";

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem;
  _onToggleWatched: (id: string) => Promise<void>;
  _onRemove: (id: string) => Promise<void>;
}

export default function MovieDetailModal({
  isOpen,
  onClose,
  item,
}: MovieDetailModalProps) {
  const { user } = useAuth();
  const [details, setDetails] = useState<DetailedMediaInfo | null>(null);
  const [similarMovies, setSimilarMovies] = useState<SimilarMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Watchlist queries
  const { data: watchList = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();

  // Review queries
  const { data: myReview } = useMyMediaReview(
    item.external_id,
    item.media_type
  );
  const { data: friendsReviews = [] } = useFriendsMediaReviews(
    item.external_id,
    item.media_type
  );
  const upsertReview = useUpsertMediaReview();
  const deleteReview = useDeleteMediaReview(item.external_id, item.media_type);

  // Review form state
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  // Sync form with existing review
  useEffect(() => {
    if (myReview) {
      setReviewText(myReview.review_text || "");
      setRating(myReview.rating);
      setIsPublic(myReview.is_public);
      setHasUnsavedChanges(false);
      setShowSavedMessage(false);
    } else {
      setHasUnsavedChanges(false);
      setShowSavedMessage(false);
    }
  }, [myReview]);

  // Track changes
  useEffect(() => {
    if (!myReview) {
      const hasAnyInput = reviewText.trim() !== "" || rating !== null;
      setHasUnsavedChanges(hasAnyInput);
      setShowSavedMessage(false);
      return;
    }

    const hasChanges =
      reviewText !== (myReview.review_text || "") ||
      rating !== myReview.rating ||
      isPublic !== myReview.is_public;

    if (hasChanges) {
      setHasUnsavedChanges(true);
      setShowSavedMessage(false);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [reviewText, rating, isPublic, myReview]);

  // Fetch details and similar movies
  useEffect(() => {
    if (!isOpen) return;

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [detailedInfo, similar] = await Promise.all([
          fetchDetailedMediaInfo(item.external_id, item.media_type),
          fetchSimilarMedia(item.external_id, item.media_type, 10),
        ]);

        if (detailedInfo) {
          setDetails(detailedInfo);
        } else {
          setError("Could not load details");
        }

        setSimilarMovies(similar);
      } catch (err) {
        console.error("Error loading movie details:", err);
        setError("Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [isOpen, item.external_id, item.media_type]);

  const handleSaveReview = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await upsertReview.mutateAsync({
        external_id: item.external_id,
        media_type: item.media_type,
        title: item.title,
        review_text: reviewText || null,
        rating,
        liked: null, // No longer using like/dislike
        is_public: isPublic,
      });
      setHasUnsavedChanges(false);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (err) {
      console.error("Error saving review:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = () => {
    if (
      myReview &&
      window.confirm("Delete your review? This cannot be undone.")
    ) {
      void deleteReview.mutateAsync(myReview.id);
    }
  };

  const handleAddSimilarToWatchlist = async (movie: SimilarMediaItem) => {
    await addToWatchlist.mutateAsync({
      external_id: movie.external_id,
      title: movie.title,
      media_type: movie.media_type,
      poster_url: movie.poster_url,
      release_date: movie.release_date,
      overview: movie.overview,
      watched: false,
    });
  };

  const releaseYear = item.release_date
    ? new Date(item.release_date).getFullYear()
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      showHeader={false}
      closeOnBackdropClick={true}
    >
      {/* Close Button */}
      <Button
        onClick={onClose}
        variant="subtle"
        size="icon"
        icon={<X className="w-5 h-5" />}
        className="absolute top-4 right-4 glass-button backdrop-blur-sm z-10"
        aria-label="Close modal"
      />

      {/* Content */}
      <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading details...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row gap-8">
              {/* Poster */}
              <div className="flex-shrink-0">
                <MoviePoster
                  posterUrl={item.poster_url}
                  title={item.title}
                  mediaType={item.media_type}
                />
              </div>

              {/* Vertical Divider (hidden on mobile) */}
              <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

              {/* Title and Info */}
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h2>
                  <MovieMetadata
                    releaseYear={releaseYear}
                    runtime={details?.runtime}
                    mediaType={item.media_type}
                  />
                </div>

                {/* Genres */}
                {details?.genres && details.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2" role="list">
                    {details.genres.map((genre) => (
                      <span
                        key={genre}
                        role="listitem"
                        className={`px-3 py-1.5 text-xs font-medium rounded-full ${getGenreColor(
                          genre
                        )}`}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating */}
                <MovieRating
                  rottenTomatoesScore={details?.rotten_tomatoes_score}
                  metacriticScore={details?.metacritic_score}
                  imdbRating={details?.imdb_rating}
                />

                {/* Crew */}
                <MovieCrewInfo
                  director={details?.director}
                  producer={details?.producer}
                  cinematographer={details?.cinematographer}
                  writer={details?.writer}
                  mediaType={item.media_type}
                />
              </div>
            </div>

            {/* Overview */}
            {(details?.overview || item.overview) && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                  Overview
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-7">
                  {details?.overview || item.overview}
                </p>
              </div>
            )}

            {/* Cast */}
            {details?.cast && details.cast.length > 0 && (
              <MovieCastList cast={details.cast} />
            )}

            {/* Awards - OMDB Data */}
            {details?.awards_text && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Awards
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {details.awards_text}
                </p>
              </div>
            )}

            {/* Box Office */}
            {details?.box_office && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Box Office
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {details.box_office}
                </p>
              </div>
            )}

            {/* Recognition Badges (old system - keep as fallback) */}
            {details?.awards &&
              details.awards.length > 0 &&
              !details.awards_text && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                    Recognition
                  </h3>
                  <div className="flex flex-wrap gap-2" role="list">
                    {details.awards.map((award, index) => (
                      <span
                        key={index}
                        role="listitem"
                        className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium border border-purple-200 dark:border-purple-800"
                      >
                        {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Review Form */}
            <MovieReviewForm
              myReview={myReview}
              friendsReviews={friendsReviews}
              reviewText={reviewText}
              rating={rating}
              isPublic={isPublic}
              isSaving={isSaving}
              showSavedMessage={showSavedMessage}
              hasUnsavedChanges={hasUnsavedChanges}
              onReviewTextChange={setReviewText}
              onRatingChange={setRating}
              onPublicChange={setIsPublic}
              onSave={() => void handleSaveReview()}
              onDelete={handleDeleteReview}
            />

            {/* Similar Movies Carousel */}
            {similarMovies.length > 0 && (
              <SimilarMoviesCarousel
                movies={similarMovies}
                onAddToWatchlist={(movie) =>
                  void handleAddSimilarToWatchlist(movie)
                }
                existingIds={watchList.map((item) => item.external_id)}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
