import { Loader2, MessageSquare } from "lucide-react";
import { MediaCrewInfo } from "./MediaCrewInfo";
import MediaMetrics from "./MediaMetrics";
import { Button } from "@/components/shared";
import { useMyMediaReview } from "@/hooks/useSimpleMediaReviews";
import type { DetailedMediaInfo } from "@/utils/tmdbDetails";

interface MediaDetailsContentProps {
  description?: string;
  details: DetailedMediaInfo | null;
  loadingDetails: boolean;
  mediaType?: "movie" | "tv" | "song" | "album" | "playlist" | "game" | "book";
  externalId?: string;
  isCompleted?: boolean;
  onOpenReview?: () => void;
  // Additional fields for non-movie media
  artist?: string;
  album?: string;
  genre?: string;
  year?: string | number;
  // Music-specific
  trackDuration?: number; // in milliseconds
  trackCount?: number;
  previewUrl?: string;
  developer?: string;
  platforms?: string;
  metacritic?: number;
  playtime?: number;
  pageCount?: number;
  authors?: string;
  publisher?: string;
  isbn?: string;
}

/**
 * MediaDetailsContent - Displays expanded media details in accordion
 *
 * Shows overview, box office, crew, cast, ratings, and awards
 * Styled to match design system with uppercase labels for metadata
 */
export default function MediaDetailsContent({
  description,
  details,
  loadingDetails,
  mediaType = "movie",
  externalId,
  isCompleted,
  onOpenReview,
  artist: _artist, // Unused - artist shown in header
  album,
  genre, // Used for games/books
  year, // Used for games/books
  trackDuration,
  trackCount,
  previewUrl,
  developer,
  platforms,
  metacritic,
  playtime,
  pageCount,
  authors,
  publisher,
  isbn,
}: MediaDetailsContentProps) {
  // Check if user has a review (only if item is completed)
  // Note: Reviews persist in DB even if item moved back to unwatched/unplayed/unlistened
  // This allows users to keep their review if they revisit later
  const { data: myReview } = useMyMediaReview(
    externalId || "",
    mediaType as string,
    isCompleted && !!externalId // Fetch for all media types when completed
  );

  const isMovie = mediaType === "movie" || mediaType === "tv";
  const isMusic =
    mediaType === "song" || mediaType === "album" || mediaType === "playlist";
  const isGame = mediaType === "game";
  const isBook = mediaType === "book";

  // Helper function to format playtime
  const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"}${
        mins > 0 ? ` ${mins} ${mins === 1 ? "minute" : "minutes"}` : ""
      }`;
    }
    return `${mins} ${mins === 1 ? "minute" : "minutes"}`;
  };

  // Helper function to format track duration from milliseconds
  const formatTrackDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Overview */}
      {description && (
        <div>
          <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
            Overview
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loadingDetails && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Music-specific details */}
      {isMusic && !loadingDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Track/Album Info */}
          <div className="space-y-2">
            {album && mediaType === "song" && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Album:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {album}
                </span>
              </div>
            )}
            {genre && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Genre:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {genre}
                </span>
              </div>
            )}
            {trackDuration && mediaType === "song" && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Duration:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatTrackDuration(trackDuration)}
                </span>
              </div>
            )}
            {trackCount && mediaType === "album" && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tracks:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {trackCount} {trackCount === 1 ? "track" : "tracks"}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Release Info */}
          <div className="space-y-2">
            {year && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Released:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {year}
                </span>
              </div>
            )}
          </div>

          {/* Preview Audio Player - Full Width Below */}
          {previewUrl && (
            <div className="col-span-1 md:col-span-2">
              <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-3">
                Preview:
              </span>
              <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/30 p-2">
                <audio controls className="w-full" preload="none">
                  <source src={previewUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game-specific details */}
      {isGame && !loadingDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {developer && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Developer:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {developer}
                </span>
              </div>
            )}
            {genre && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Genre:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {genre}
                </span>
              </div>
            )}
            {platforms && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Platforms:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {platforms}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {year && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Release Year:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {year}
                </span>
              </div>
            )}
            {metacritic && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Metacritic:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {metacritic}
                </span>
              </div>
            )}
            {playtime && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Avg Playtime:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatPlaytime(playtime)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book-specific details */}
      {isBook && !loadingDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {authors && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Author:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {authors}
                </span>
              </div>
            )}
            {publisher && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Publisher:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {publisher}
                </span>
              </div>
            )}
            {genre && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Category:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {genre}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {year && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Published:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {year}
                </span>
              </div>
            )}
            {pageCount && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Pages:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {pageCount} (
                  {formatPlaytime(Math.round((pageCount / 250) * 60))})
                </span>
              </div>
            )}
            {isbn && (
              <div className="text-sm">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  ISBN:
                </span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {isbn}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Movie/TV-specific details (Box Office, Crew, Cast, Ratings, Awards) */}
      {isMovie && (
        <>
          {/* Box Office - Above crew/cast section */}
          {details && !loadingDetails && details.box_office && (
            <div className="text-sm">
              <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Box Office:
              </span>{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {details.box_office}
              </span>
            </div>
          )}

          {/* Crew and Cast in 2-column layout */}
          {details && !loadingDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Crew Info */}
              {(details.director ||
                details.producer ||
                details.cinematographer ||
                details.writer) && (
                <MediaCrewInfo
                  director={details.director}
                  producer={details.producer}
                  cinematographer={details.cinematographer}
                  writer={details.writer}
                  mediaType={mediaType}
                />
              )}

              {/* Right Column: Cast (top 10 only) */}
              {details.cast && details.cast.length > 0 && (
                <div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Cast:
                      </span>{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {details.cast.slice(0, 10).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ratings and Awards in 2-column layout */}
          {details && !loadingDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Critic Ratings */}
              {(details.rotten_tomatoes_score ||
                details.metacritic_score ||
                details.imdb_rating) && (
                <div className="space-y-2">
                  {details.rotten_tomatoes_score && (
                    <div className="text-sm">
                      <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Rotten Tomatoes:
                      </span>{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {details.rotten_tomatoes_score}
                      </span>
                    </div>
                  )}
                  {details.metacritic_score && (
                    <div className="text-sm">
                      <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Metacritic:
                      </span>{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {details.metacritic_score}
                      </span>
                    </div>
                  )}
                  {details.imdb_rating && (
                    <div className="text-sm">
                      <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        IMDB:
                      </span>{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {details.imdb_rating}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Right Column: Awards */}
              {details.awards_text && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Awards:
                    </span>
                  </div>
                  <MediaMetrics awards={details.awards_text} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Review Button - Bottom Right (for all completed media types) */}
      {isCompleted && externalId && onOpenReview && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={onOpenReview}
            variant="secondary"
            icon={<MessageSquare className="w-4 h-4" />}
          >
            {myReview ? "Edit Review" : "Review"}
          </Button>
        </div>
      )}
    </div>
  );
}
