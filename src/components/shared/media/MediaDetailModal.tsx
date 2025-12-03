import { X } from "lucide-react";
import Modal from "../ui/Modal";
import MediaPoster from "./MediaPoster";
import MediaHeader from "./MediaHeader";
import MediaReview from "./MediaReview";
import MediaDetailActions from "./MediaDetailActions";
import MediaOverviewSection from "./MediaOverviewSection";
import type { MetadataItem } from "../common/MetadataRow";

type MediaType = "movie" | "tv" | "book" | "game" | "music";
type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

/**
 * Status can be either a MediaStatus string (for movies/TV)
 * or a custom object with label and isCompleted (for books/games)
 */
type StatusType = MediaStatus | { label: string; isCompleted: boolean };

/**
 * MediaDetailModal - Unified modal for displaying media details
 *
 * This component provides a consistent structure for all media types (movies, TV, books, games, music).
 * The modal includes a poster sidebar with action buttons and a main content area.
 *
 * ## Content Structure
 *
 * The modal renders content in this order:
 * 1. **Header** (title, metadata, genres) - always rendered
 * 2. **Overview Section** - rendered when `description` or `additionalContent` is present
 *    - Wraps content in `MediaOverviewSection` component automatically
 *    - Displays `description` if provided
 *    - Renders `additionalContent` below description
 * 3. **Review Section** - rendered when `showReviewSection={true}` (movies/TV only)
 *    - Uses `MediaReview` component with rating/review form
 * 4. **Custom Review Section** - rendered when `reviewSection` is provided (books only)
 *    - Custom implementation (e.g., accordion-based review for books)
 *
 * ## Usage of `additionalContent`
 *
 * The `additionalContent` prop is flexible and media-type specific. It typically contains:
 * - **Contributors**: Authors, artists, cast, platforms (use `MediaContributorList` for consistency)
 * - **Metrics**: RAWG ratings, critic scores, box office (use existing metric components)
 * - **User Content**: Personal notes and ratings (use `MediaUserNotes` and `MediaUserRating`)
 *
 * **Important**: Do NOT wrap `additionalContent` in `MediaOverviewSection` - the modal handles that.
 * Simply pass the inner content and the modal will wrap it in the Overview section automatically.
 *
 * ## Media-Specific Patterns
 *
 * ### Movies/TV Shows
 * - Use `showReviewSection={true}` to enable the `MediaReview` component
 * - `additionalContent`: crew info, cast, critic ratings, awards, box office
 * - Rating/review handled by `MediaReview` component (shared social reviews)
 *
 * ### Books
 * - Use `showReviewSection={false}` and provide custom `reviewSection` (accordion)
 * - `additionalContent`: author (inline), user notes
 * - Rating handled by custom accordion-based review section
 *
 * ### Games
 * - Use `showReviewSection={false}` (no review system for games)
 * - `additionalContent`: platforms (chips), RAWG rating, user rating
 * - Rating handled inline via `MediaUserRating` in `additionalContent`
 *
 * ### Music
 * - Use `showReviewSection={false}` (no review system for music)
 * - `additionalContent`: artist (inline), album info, user notes, user rating
 * - Rating handled inline via `MediaUserRating` in `additionalContent`
 *
 * ## Recommended Components
 *
 * For consistency across media types, use these reusable components in `additionalContent`:
 * - `MediaContributorList` - for authors, artists, cast, platforms
 * - `MediaUserNotes` - for personal notes/thoughts
 * - `MediaUserRating` - for personal ratings (games/music/books accordion)
 * - `MediaCrewInfo`, `MediaCastList`, `MediaMetrics` - for movies/TV specific data
 *
 * These are recommendations, not requirements. Adapt as needed for your media type.
 */
interface MediaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: MediaType;
  title: string;
  posterUrl?: string;
  metadata: MetadataItem[];
  genres?: string[] | string;
  description?: string;
  status: StatusType;
  onStatusChange: (status: MediaStatus) => void;
  onRemove: () => void;
  showReviewSection?: boolean;
  isInWatchlist?: boolean;
  additionalContent?: React.ReactNode;
  reviewSection?: React.ReactNode;
  // Review props
  myReview?: {
    id: string;
    review_text: string | null;
    rating: number | null;
    is_edited?: boolean;
    edited_at?: string | null;
  } | null;
  friendsReviews?: Array<{
    id: string;
    display_name?: string;
    review_text: string | null;
    rating: number | null;
  }>;
  rating: number | null;
  reviewText: string;
  isPublic: boolean;
  isSaving?: boolean;
  showSavedMessage?: boolean;
  hasUnsavedChanges?: boolean;
  onRatingChange: (rating: number | null) => void;
  onReviewTextChange: (text: string) => void;
  onPublicChange: (isPublic: boolean) => void;
  onSaveReview: () => void;
  onDeleteReview?: () => void;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "6xl";
}

export default function MediaDetailModal({
  isOpen,
  onClose,
  mediaType,
  title,
  posterUrl,
  metadata,
  genres,
  description,
  status,
  onStatusChange,
  onRemove,
  showReviewSection = true,
  isInWatchlist = true,
  additionalContent,
  reviewSection,
  myReview,
  friendsReviews = [],
  rating,
  reviewText,
  isPublic,
  isSaving = false,
  showSavedMessage = false,
  hasUnsavedChanges = false,
  onRatingChange,
  onReviewTextChange,
  onPublicChange,
  onSaveReview,
  onDeleteReview,
  maxWidth = "5xl",
}: MediaDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      showHeader={false}
    >
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 shadow-lg"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content - Single Column with Sticky Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8 p-6 max-h-[85vh] overflow-y-auto">
          {/* Poster Sidebar */}
          <div className="flex-shrink-0 lg:sticky lg:top-0 lg:self-start space-y-4">
            <div className="group">
              <MediaPoster
                src={posterUrl}
                alt={`${title} poster`}
                size="lg"
                aspectRatio="2/3"
                className="mx-auto lg:mx-0 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>

            {/* Action Buttons */}
            <MediaDetailActions
              status={status}
              mediaType={mediaType}
              onStatusChange={onStatusChange}
              onRemove={onRemove}
              isInWatchlist={isInWatchlist}
            />
          </div>

          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            {/* Header: Title, Metadata, Genres */}
            <div className="pb-5">
              <MediaHeader title={title} metadata={metadata} genres={genres} />
            </div>

            {/* Overview Section - includes description and additional content */}
            {(description || additionalContent) && (
              <MediaOverviewSection description={description}>
                {additionalContent}
              </MediaOverviewSection>
            )}

            {/* Review Section */}
            {showReviewSection && (
              <MediaReview
                myReview={myReview}
                friendsReviews={friendsReviews}
                rating={rating}
                reviewText={reviewText}
                isPublic={isPublic}
                isSaving={isSaving}
                showSavedMessage={showSavedMessage}
                hasUnsavedChanges={hasUnsavedChanges}
                onRatingChange={onRatingChange}
                onReviewTextChange={onReviewTextChange}
                onPublicChange={onPublicChange}
                onSave={onSaveReview}
                onDelete={onDeleteReview}
              />
            )}

            {/* Custom Review Section (e.g., for books with accordion) */}
            {reviewSection && reviewSection}
          </div>
        </div>
      </div>
    </Modal>
  );
}
