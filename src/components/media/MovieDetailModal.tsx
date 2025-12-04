import { useState, useEffect } from "react";
import { Loader2, Calendar, Clock } from "lucide-react";
import {
  MediaDetailModal,
  MediaDetailsContent,
  Button,
  type MetadataItem,
} from "@/components/shared";
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

type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

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
        liked: null,
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

  const handleStatusChange = (newStatus: MediaStatus) => {
    // Map status to watched boolean
    // For now, we'll just toggle watched on/off based on completed vs other states
    // In the future, this should update a proper status field
    if (newStatus === "completed" && !item.watched) {
      void handleToggleWatched();
    } else if (newStatus !== "completed" && item.watched) {
      void handleToggleWatched();
    }
  };

  const handleRemoveFromWatchlist = () => {
    // This should be handled by the parent component
    // Just close the modal for now
    onClose();
  };

  // Map watched boolean to status
  const currentStatus: MediaStatus = item.watched ? "completed" : "planned";

  const releaseYear = item.release_date
    ? new Date(item.release_date).getFullYear()
    : null;

  // Build metadata array
  const metadata: MetadataItem[] = [
    ...(releaseYear
      ? [
          {
            icon: Calendar,
            value: String(releaseYear),
            label: String(releaseYear),
          },
        ]
      : []),
    ...(details?.runtime
      ? [
          {
            icon: Clock,
            value: `${details.runtime}min`,
            label: `${details.runtime}min`,
          },
        ]
      : []),
  ];

  // Build additional content using MediaDetailsContent
  const additionalContent = (
    <MediaDetailsContent
      title={item.title}
      details={details}
      loadingDetails={loading}
      mediaType={item.media_type}
      externalId={item.external_id}
      isCompleted={item.watched}
      onOpenReview={() => {
        // Scroll to review section or focus on it
        const reviewSection = document.querySelector("[data-review-section]");
        if (reviewSection) {
          reviewSection.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }}
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
        status={currentStatus}
        onStatusChange={handleStatusChange}
        onRemove={handleRemoveFromWatchlist}
        myReview={myReview}
        friendsReviews={friendsReviews}
        rating={rating}
        reviewText={reviewText}
        isPublic={isPublic}
        isSaving={isSaving}
        showSavedMessage={showSavedMessage}
        hasUnsavedChanges={hasUnsavedChanges}
        onRatingChange={setRating}
        onReviewTextChange={setReviewText}
        onPublicChange={setIsPublic}
        onSaveReview={() => void handleSaveReview()}
        onDeleteReview={handleDeleteReview}
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
        status={currentStatus}
        onStatusChange={handleStatusChange}
        onRemove={handleRemoveFromWatchlist}
        myReview={myReview}
        friendsReviews={friendsReviews}
        rating={rating}
        reviewText={reviewText}
        isPublic={isPublic}
        isSaving={isSaving}
        showSavedMessage={showSavedMessage}
        hasUnsavedChanges={hasUnsavedChanges}
        onRatingChange={setRating}
        onReviewTextChange={setReviewText}
        onPublicChange={setIsPublic}
        onSaveReview={() => void handleSaveReview()}
        onDeleteReview={handleDeleteReview}
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
        description={details?.overview || item.overview || undefined}
        status={currentStatus}
        onStatusChange={handleStatusChange}
        onRemove={handleRemoveFromWatchlist}
        myReview={myReview}
        friendsReviews={friendsReviews}
        rating={rating}
        reviewText={reviewText}
        isPublic={isPublic}
        isSaving={isSaving}
        showSavedMessage={showSavedMessage}
        hasUnsavedChanges={hasUnsavedChanges}
        onRatingChange={setRating}
        onReviewTextChange={setReviewText}
        onPublicChange={setIsPublic}
        onSaveReview={() => void handleSaveReview()}
        onDeleteReview={handleDeleteReview}
        additionalContent={additionalContent}
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
