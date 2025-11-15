/**
 * @deprecated This component will be migrated to use the unified MediaDetailModal.
 * For new features, consider using MediaDetailModal from @/components/shared instead.
 * This component shares 90% of its structure with GameDetailModal and BookDetailModal.
 * Future work: Migrate to MediaDetailModal to eliminate ~600 lines of duplicated code.
 */

import { useState, useEffect } from "react";
import { Loader2, Award, DollarSign, Calendar, Clock } from "lucide-react";
import MediaDetailModal from "../shared/MediaDetailModal";
import Button from "../shared/Button";
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
  useToggleWatchlistWatched,
} from "../../hooks/useWatchlistQueries";
import {
  useMyMediaReview,
  useFriendsMediaReviews,
  useUpsertMediaReview,
  useDeleteMediaReview,
} from "../../hooks/useSimpleMediaReviews";
import { useAuth } from "../../contexts/AuthContext";
import type { MetadataItem } from "../shared/MetadataRow";

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem;
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
  const toggleWatched = useToggleWatchlistWatched();

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

  const handleToggleWatched = async () => {
    await toggleWatched.mutateAsync(item.id);
  };

  const handleRemoveFromWatchlist = async () => {
    // This should be handled by the parent component
    // Just close the modal for now
    onClose();
  };

  const releaseYear = item.release_date
    ? new Date(item.release_date).getFullYear()
    : null;

  // Build metadata array
  const metadata: MetadataItem[] = [
    ...(releaseYear
      ? [{ icon: <Calendar className="w-4 h-4" />, label: String(releaseYear) }]
      : []),
    ...(details?.runtime
      ? [
          {
            icon: <Clock className="w-4 h-4" />,
            label: `${details.runtime}min`,
          },
        ]
      : []),
  ];

  // Build additional content (crew, cast, awards, box office)
  const additionalContent = details ? (
    <>
      {/* Crew */}
      <MovieCrewInfo
        director={details.director}
        producer={details.producer}
        cinematographer={details.cinematographer}
        writer={details.writer}
        mediaType={item.media_type}
      />

      {/* Cast */}
      {details.cast && details.cast.length > 0 && (
        <MovieCastList cast={details.cast} />
      )}

      {/* Awards */}
      {details.awards_text && (
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
      {details.box_office && (
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

      {/* Recognition Badges (fallback) */}
      {details.awards && details.awards.length > 0 && !details.awards_text && (
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

      {/* Ratings (RT, Metacritic, IMDB) */}
      {(details.rotten_tomatoes_score ||
        details.metacritic_score ||
        details.imdb_rating) && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Critic Ratings
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            {details.rotten_tomatoes_score && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">RT: </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {details.rotten_tomatoes_score}%
                </span>
              </div>
            )}
            {details.metacritic_score && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Metacritic:{" "}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {details.metacritic_score}
                </span>
              </div>
            )}
            {details.imdb_rating && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">IMDB: </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {details.imdb_rating}/10
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  ) : null;

  // Build review section
  const reviewSection = (
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
  );

  if (loading) {
    return (
      <MediaDetailModal
        isOpen={isOpen}
        onClose={onClose}
        mediaType={item.media_type}
        title={item.title}
        posterUrl={item.poster_url || undefined}
        metadata={[]}
        genres={[]}
        description=""
        status={{
          label: item.status || "planned",
          isCompleted: item.watched,
        }}
        rating={rating}
        onRatingChange={setRating}
        onToggleStatus={handleToggleWatched}
        onRecommend={() => {}}
        onRemove={handleRemoveFromWatchlist}
        additionalContent={
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading details...
            </p>
          </div>
        }
      />
    );
  }

  if (error) {
    return (
      <MediaDetailModal
        isOpen={isOpen}
        onClose={onClose}
        mediaType={item.media_type}
        title={item.title}
        posterUrl={item.poster_url || undefined}
        metadata={[]}
        genres={[]}
        description=""
        status={{
          label: item.status || "planned",
          isCompleted: item.watched,
        }}
        rating={rating}
        onRatingChange={setRating}
        onToggleStatus={handleToggleWatched}
        onRecommend={() => {}}
        onRemove={handleRemoveFromWatchlist}
        additionalContent={
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <>
      <MediaDetailModal
        isOpen={isOpen}
        onClose={onClose}
        mediaType={item.media_type}
        title={item.title}
        posterUrl={item.poster_url || undefined}
        metadata={metadata}
        genres={details?.genres || []}
        description={details?.overview || item.overview}
        status={{
          label: item.status || "planned",
          isCompleted: item.watched,
        }}
        rating={rating}
        onRatingChange={setRating}
        onToggleStatus={handleToggleWatched}
        onRecommend={() => {}}
        onRemove={handleRemoveFromWatchlist}
        additionalContent={additionalContent}
        reviewSection={reviewSection}
      />

      {/* Similar Movies Carousel - rendered separately below modal */}
      {isOpen && similarMovies.length > 0 && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="pointer-events-auto absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-6xl px-4">
            <SimilarMoviesCarousel
              movies={similarMovies}
              onAddToWatchlist={(movie) =>
                void handleAddSimilarToWatchlist(movie)
              }
              existingIds={watchList.map((item) => item.external_id)}
            />
          </div>
        </div>
      )}
    </>
  );
}
