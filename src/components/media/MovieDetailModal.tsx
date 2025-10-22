import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Calendar,
  Clock,
  Users as UsersIcon,
  Film,
  Tv,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import {
  fetchDetailedMediaInfo,
  DetailedMediaInfo,
} from "../../utils/tmdbDetails";
import type { WatchlistItem } from "../../services/recommendationsService";
import { MediaReviewCard } from "./MediaReviewCard";
import { MediaReviewForm } from "./MediaReviewForm";
import {
  useMyReview,
  useFriendsReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useToggleReviewPrivacy,
} from "../../hooks/useMediaReviews";
import { useAuth } from "../../contexts/AuthContext";
import type {
  CreateReviewData,
  UpdateReviewData,
} from "../../services/reviewsService.types";
import { supabase } from "../../lib/supabase";
import type { Recommendation } from "../../services/recommendationsService.types";

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
  const { user } = useAuth();
  const [details, setDetails] = useState<DetailedMediaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "personal">(
    "overview"
  );
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [recommendation, setRecommendation] = useState<
    (Recommendation & { sender?: { display_name: string } }) | null
  >(null);
  const [recipientNote, setRecipientNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Fetch review data
  const { data: myReview } = useMyReview(item.external_id, item.media_type);
  const { data: friendsReviews = [] } = useFriendsReviews(
    item.external_id,
    item.media_type
  );

  // Review mutations
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const toggleReviewPrivacy = useToggleReviewPrivacy();

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

  // Fetch recommendation data if this item came from a recommendation
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const loadRecommendation = async () => {
      try {
        // Determine table name based on media type
        const tableName =
          item.media_type === "movie" || item.media_type === "tv"
            ? "movie_recommendations"
            : "music_recommendations";

        // Query for recommendation where current user is recipient
        const { data, error } = await supabase
          .from(tableName)
          .select("*, sender:user_profiles!from_user_id(display_name)")
          .eq("to_user_id", user.id)
          .eq("external_id", item.external_id)
          .eq("media_type", item.media_type)
          .maybeSingle();

        if (error) {
          console.error("Error fetching recommendation:", error);
          return;
        }

        if (data) {
          setRecommendation(
            data as Recommendation & { sender?: { display_name: string } }
          );
          setRecipientNote(data.recipient_note || "");
        }
      } catch (err) {
        console.error("Error loading recommendation:", err);
      }
    };

    void loadRecommendation();
  }, [isOpen, user?.id, item.external_id, item.media_type]);

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

  // Handle recommendation status update
  const handleUpdateRecommendationStatus = async (status: "hit" | "miss") => {
    if (!recommendation) return;

    try {
      const tableName =
        item.media_type === "movie" || item.media_type === "tv"
          ? "movie_recommendations"
          : "music_recommendations";

      const { error } = await supabase
        .from(tableName)
        .update({
          status,
          watched_at: new Date().toISOString(),
        })
        .eq("id", recommendation.id);

      if (error) throw error;

      // Update local state
      setRecommendation({ ...recommendation, status });
    } catch (err) {
      console.error("Error updating recommendation status:", err);
    }
  };

  // Handle recipient note update
  const handleSaveRecipientNote = async () => {
    if (!recommendation) return;

    try {
      const tableName =
        item.media_type === "movie" || item.media_type === "tv"
          ? "movie_recommendations"
          : "music_recommendations";

      const { error } = await supabase
        .from(tableName)
        .update({ recipient_note: recipientNote })
        .eq("id", recommendation.id);

      if (error) throw error;

      // Update local state
      setRecommendation({ ...recommendation, recipient_note: recipientNote });
      setIsEditingNote(false);
    } catch (err) {
      console.error("Error updating recipient note:", err);
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

      {/* Tab Navigation */}
      {!loading && !error && (
        <div
          role="tablist"
          className="flex border-b border-gray-200 dark:border-gray-700 px-6 sm:px-8 pt-6"
        >
          <button
            role="tab"
            aria-selected={activeTab === "overview"}
            aria-controls="overview-panel"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "personal"}
            aria-controls="personal-panel"
            onClick={() => setActiveTab("personal")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              activeTab === "personal"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Personal
          </button>
        </div>
      )}

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
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div id="overview-panel" role="tabpanel" className="space-y-6">
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
                            <span className="capitalize">
                              {item.media_type}
                            </span>
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
                            {item.media_type === "tv"
                              ? "Creator:"
                              : "Director:"}
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
                      <UsersIcon className="w-5 h-5" aria-hidden="true" />
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

            {/* Personal Tab */}
            {activeTab === "personal" && (
              <div id="personal-panel" role="tabpanel" className="space-y-6">
                {/* Contextual Banner - Recommendation or Self-added */}
                {recommendation ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <span
                        className="text-2xl"
                        role="img"
                        aria-label="Lightbulb"
                      >
                        💡
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          This was recommended by{" "}
                          {recommendation.sender?.display_name || "a friend"}
                        </p>
                        {recommendation.sent_message && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                            "{recommendation.sent_message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          You can give private feedback to{" "}
                          {recommendation.sender?.display_name || "them"} and/or
                          share a public review with all friends
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" role="img" aria-label="Note">
                        📝
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          You added this to your watchlist
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Share your thoughts with friends or keep your review
                          private
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Summary Header */}
                {(myReview || friendsReviews.length > 0) && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Your Rating */}
                      {myReview && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your Rating:
                          </span>
                          {myReview.rating && (
                            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {myReview.rating}/5
                              </span>
                            </div>
                          )}
                          {myReview.liked != null && (
                            <div
                              className={`px-3 py-1 rounded-full ${
                                myReview.liked
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}
                            >
                              {myReview.liked ? "👍 Liked" : "👎 Disliked"}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Friends Average */}
                      {friendsReviews.length > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Friends Average:
                          </span>
                          {(() => {
                            const ratingsWithValues = friendsReviews.filter(
                              (r) => r.rating != null
                            );
                            if (ratingsWithValues.length > 0) {
                              const avgRating =
                                ratingsWithValues.reduce(
                                  (sum, r) => sum + (r.rating as number),
                                  0
                                ) / ratingsWithValues.length;
                              return (
                                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {avgRating.toFixed(1)}/5
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                    ({ratingsWithValues.length}{" "}
                                    {ratingsWithValues.length === 1
                                      ? "friend"
                                      : "friends"}
                                    )
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                No ratings yet
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User's Own Review Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Your Public Review
                    </h3>
                    <span
                      className="text-xs text-gray-500 dark:text-gray-400 cursor-help"
                      title="Share your detailed thoughts with all friends. This is separate from any private feedback you give to recommenders."
                    >
                      ⓘ
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {myReview?.is_public
                      ? "Visible to all friends"
                      : "Private - only you can see this"}
                  </p>

                  {showReviewForm ? (
                    <MediaReviewForm
                      initialData={
                        editingReview ? myReview ?? undefined : undefined
                      }
                      externalId={item.external_id}
                      mediaType={item.media_type}
                      title={item.title}
                      onSubmit={async (data) => {
                        if (!user?.id) return;

                        if (editingReview && myReview) {
                          // Update existing review
                          await updateReview.mutateAsync({
                            reviewId: myReview.id,
                            externalId: item.external_id,
                            mediaType: item.media_type,
                            data: data as UpdateReviewData,
                          });
                        } else {
                          // Create new review - inject user_id
                          await createReview.mutateAsync({
                            ...(data as Omit<CreateReviewData, "user_id">),
                            user_id: user.id,
                          });
                        }
                        setShowReviewForm(false);
                        setEditingReview(false);
                      }}
                      onCancel={() => {
                        setShowReviewForm(false);
                        setEditingReview(false);
                      }}
                      isLoading={
                        createReview.isPending || updateReview.isPending
                      }
                    />
                  ) : myReview ? (
                    <MediaReviewCard
                      review={{ ...myReview, display_name: "You" }}
                      isOwnReview={true}
                      onEdit={() => {
                        setEditingReview(true);
                        setShowReviewForm(true);
                      }}
                      onDelete={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete your review?"
                          )
                        ) {
                          void deleteReview.mutateAsync({
                            reviewId: myReview.id,
                            externalId: item.external_id,
                            mediaType: item.media_type,
                          });
                        }
                      }}
                      onTogglePrivacy={(isPublic) => {
                        void toggleReviewPrivacy.mutateAsync({
                          reviewId: myReview.id,
                          externalId: item.external_id,
                          mediaType: item.media_type,
                          isPublic,
                        });
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You haven't reviewed this yet
                      </p>
                      <Button
                        onClick={() => setShowReviewForm(true)}
                        variant="primary"
                      >
                        Add Your Review
                      </Button>
                    </div>
                  )}
                </div>

                {/* Feedback to Friend Section - Only for recommendations */}
                {recommendation && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                        Feedback to{" "}
                        {recommendation.sender?.display_name || "Friend"}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Private - only{" "}
                      {recommendation.sender?.display_name || "they"} can see
                      this
                    </p>

                    {/* Current Status Display */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <strong>Status:</strong>{" "}
                        {recommendation.status === "hit" && (
                          <span className="text-green-600 dark:text-green-400">
                            ✓ Hit
                          </span>
                        )}
                        {recommendation.status === "miss" && (
                          <span className="text-orange-600 dark:text-orange-400">
                            ✗ Miss
                          </span>
                        )}
                        {recommendation.status === "pending" && (
                          <span className="text-gray-500 dark:text-gray-400">
                            Pending
                          </span>
                        )}
                      </p>
                      {recommendation.status !== "pending" && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          You marked this as a {recommendation.status} for{" "}
                          {recommendation.sender?.display_name || "them"}
                        </p>
                      )}
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        onClick={() =>
                          void handleUpdateRecommendationStatus("hit")
                        }
                        variant={
                          recommendation.status === "hit"
                            ? "primary"
                            : "secondary"
                        }
                        size="sm"
                        icon={<ThumbsUp className="w-4 h-4" />}
                      >
                        Mark as Hit
                      </Button>
                      <Button
                        onClick={() =>
                          void handleUpdateRecommendationStatus("miss")
                        }
                        variant={
                          recommendation.status === "miss"
                            ? "primary"
                            : "secondary"
                        }
                        size="sm"
                        icon={<ThumbsDown className="w-4 h-4" />}
                      >
                        Mark as Miss
                      </Button>
                    </div>

                    {/* Recipient Note */}
                    <div>
                      <label
                        htmlFor="recipient-note"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Private Note
                      </label>
                      {isEditingNote ? (
                        <div className="space-y-2">
                          <textarea
                            id="recipient-note"
                            value={recipientNote}
                            onChange={(e) => setRecipientNote(e.target.value)}
                            placeholder="Add a private note..."
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => void handleSaveRecipientNote()}
                              variant="primary"
                              size="sm"
                            >
                              Save Note
                            </Button>
                            <Button
                              onClick={() => {
                                setRecipientNote(
                                  recommendation.recipient_note || ""
                                );
                                setIsEditingNote(false);
                              }}
                              variant="secondary"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {recommendation.recipient_note ? (
                            <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-2">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {recommendation.recipient_note}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              No private note yet
                            </p>
                          )}
                          <Button
                            onClick={() => setIsEditingNote(true)}
                            variant="secondary"
                            size="sm"
                          >
                            {recommendation.recipient_note
                              ? "Edit Note"
                              : "Add Note"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Watched Status Section */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Watched Status
                  </h3>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div>
                      {item.watched && item.watched_at ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Watched on{" "}
                          {new Date(item.watched_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Not yet watched
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleToggleWatched}
                      variant={item.watched ? "secondary" : "primary"}
                      size="sm"
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
                  </div>
                </div>

                {/* Friends' Reviews Section */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    What Your Friends Think
                  </h3>

                  {friendsReviews.length > 0 ? (
                    <div className="space-y-4">
                      {friendsReviews.map((review) => (
                        <MediaReviewCard
                          key={review.id}
                          review={review}
                          isOwnReview={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <UsersIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        None of your friends have reviewed this yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default MovieDetailModal;
