import { MessageSquare } from "lucide-react";
import { Button, AudioPlayer } from "@/components/shared";
import { useMyMediaReview } from "@/hooks/useSimpleMediaReviews";
import type { DetailedMediaInfo } from "@/utils/tmdbDetails";

interface MediaDetailsContentProps {
  title?: string; // Media title for aria-label context
  description?: string; // Overview/description text
  details: DetailedMediaInfo | null;
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
  rawgRating?: number; // RAWG rating out of 5
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
  title,
  description,
  details,
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
  rawgRating,
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

  // Helper function to parse awards string and extract individual awards as chips
  const parseAwards = (awardsText: string): string[] => {
    const awards: string[] = [];

    // Extract Oscar wins
    const oscarMatch = awardsText.match(/Won (\d+) Oscar/i);
    if (oscarMatch) {
      const count = parseInt(oscarMatch[1]);
      awards.push(count === 1 ? "Oscar Winner" : `${count} Oscars`);
    }

    // Extract nominated for Oscar
    if (awardsText.match(/Nominated for (\d+) Oscar/i)) {
      awards.push("Oscar Nominated");
    }

    // Extract other wins
    const winsMatch = awardsText.match(/(\d+) wins?/i);
    if (winsMatch && !oscarMatch) {
      awards.push(`${winsMatch[1]} Wins`);
    }

    // Extract nominations
    const nomsMatch = awardsText.match(/(\d+) nominations?/i);
    if (nomsMatch) {
      awards.push(`${nomsMatch[1]} Nominations`);
    }

    // Extract BAFTA
    if (awardsText.match(/BAFTA/i)) {
      awards.push("BAFTA");
    }

    // Extract Golden Globe
    if (awardsText.match(/Golden Globe/i)) {
      awards.push("Golden Globe");
    }

    return awards;
  };

  // Helper function to get color styling for award chips
  const getAwardChipStyle = (award: string): string => {
    if (award.includes("Oscar")) {
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
    }
    if (award.includes("Golden Globe")) {
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700";
    }
    if (award.includes("BAFTA")) {
      return "bg-primary/10 text-primary border-primary/30";
    }
    if (award.includes("Wins")) {
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
    }
    if (award.includes("Nominations")) {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
    }
    return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700";
  };

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

  // Helper function to estimate reading time from page count
  // Assumes 250 words per page and average reading speed of ~250 words/minute
  const formatReadingTime = (pages: number): string => {
    const minutes = Math.round((pages / 250) * 60); // ~1 minute per page
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `approx. ${hours} ${hours === 1 ? "hour" : "hours"}${
        mins > 0 ? ` ${mins} ${mins === 1 ? "minute" : "minutes"}` : ""
      } reading`;
    }
    return `approx. ${mins} ${mins === 1 ? "minute" : "minutes"} reading`;
  };

  return (
    <div className="space-y-4">
      {/* Overview Section */}
      {description && (
        <div>
          <h4 className="section-title">Overview</h4>
          <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {/* Music-specific details */}
      {isMusic && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Details */}
          <div>
            {(album || genre || trackDuration || trackCount) && (
              <div>
                <h4 className="section-title">Details</h4>
                <div className="space-y-2">
                  {album && mediaType === "song" && (
                    <div className="text-sm">
                      <span className="metadata-label">Album:</span>{" "}
                      <span className="metadata-value">{album}</span>
                    </div>
                  )}
                  {genre && (
                    <div className="text-sm">
                      <span className="metadata-label">Genre:</span>{" "}
                      <span className="metadata-value">{genre}</span>
                    </div>
                  )}
                  {trackDuration && mediaType === "song" && (
                    <div className="text-sm">
                      <span className="metadata-label">Duration:</span>{" "}
                      <span className="metadata-value">
                        {formatTrackDuration(trackDuration)}
                      </span>
                    </div>
                  )}
                  {trackCount && mediaType === "album" && (
                    <div className="text-sm">
                      <span className="metadata-label">Tracks:</span>{" "}
                      <span className="metadata-value">
                        {trackCount} {trackCount === 1 ? "track" : "tracks"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Info and Preview */}
          <div className="space-y-4">
            {year && (
              <div>
                <h4 className="section-title">Info</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="metadata-label">Released:</span>{" "}
                    <span className="metadata-value">{year}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Audio Player */}
            {previewUrl && (
              <div>
                <h4 className="section-title">Preview</h4>
                <AudioPlayer src={previewUrl} title={title} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game-specific details */}
      {isGame && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Details */}
          <div>
            {(developer || genre || platforms || year) && (
              <div>
                <h4 className="section-title">Details</h4>
                <div className="space-y-2">
                  {developer && (
                    <div className="text-sm">
                      <span className="metadata-label">Developer:</span>{" "}
                      <span className="metadata-value">{developer}</span>
                    </div>
                  )}
                  {genre && (
                    <div className="text-sm">
                      <span className="metadata-label">Genre:</span>{" "}
                      <span className="metadata-value">{genre}</span>
                    </div>
                  )}
                  {platforms && (
                    <div className="text-sm">
                      <span className="metadata-label">Platforms:</span>{" "}
                      <span className="metadata-value">{platforms}</span>
                    </div>
                  )}
                  {year && (
                    <div className="text-sm">
                      <span className="metadata-label">Release Year:</span>{" "}
                      <span className="metadata-value">{year}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Reviews & Info */}
          <div className="space-y-4">
            {(metacritic || rawgRating) && (
              <div>
                <h4 className="section-title">Reviews</h4>
                <div className="space-y-2">
                  {metacritic && (
                    <div className="text-sm">
                      <span className="metadata-label">Metacritic:</span>{" "}
                      <span className="metadata-value">{metacritic}/100</span>
                    </div>
                  )}
                  {rawgRating && (
                    <div className="text-sm">
                      <span className="metadata-label">RAWG Rating:</span>{" "}
                      <span className="metadata-value">
                        {rawgRating.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {playtime && (
              <div>
                <h4 className="section-title">Info</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="metadata-label">Avg Playtime:</span>{" "}
                    <span className="metadata-value">
                      {formatPlaytime(playtime)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book-specific details */}
      {isBook && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Details */}
          <div>
            {(authors || publisher || genre) && (
              <div>
                <h4 className="section-title">Details</h4>
                <div className="space-y-2">
                  {authors && (
                    <div className="text-sm">
                      <span className="metadata-label">Author:</span>{" "}
                      <span className="metadata-value">{authors}</span>
                    </div>
                  )}
                  {publisher && (
                    <div className="text-sm">
                      <span className="metadata-label">Publisher:</span>{" "}
                      <span className="metadata-value">{publisher}</span>
                    </div>
                  )}
                  {genre && (
                    <div className="text-sm">
                      <span className="metadata-label">Category:</span>{" "}
                      <span className="metadata-value">{genre}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Info */}
          <div>
            {(year || pageCount || isbn) && (
              <div>
                <h4 className="section-title">Info</h4>
                <div className="space-y-2">
                  {year && (
                    <div className="text-sm">
                      <span className="metadata-label">Published:</span>{" "}
                      <span className="metadata-value">{year}</span>
                    </div>
                  )}
                  {pageCount && (
                    <div className="text-sm">
                      <span className="metadata-label">Pages:</span>{" "}
                      <span className="metadata-value">
                        {pageCount} ({formatReadingTime(pageCount)})
                      </span>
                    </div>
                  )}
                  {isbn && (
                    <div className="text-sm">
                      <span className="metadata-label">ISBN:</span>{" "}
                      <span className="metadata-value">{isbn}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Movie/TV-specific details (Box Office, Crew, Cast, Ratings, Awards) */}
      {isMovie && (
        <>
          {/* Two-column layout for all movie details */}
          {details && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details (Crew/Cast) */}
              <div>
                {/* Details Section */}
                {(details.director ||
                  details.producer ||
                  details.cinematographer ||
                  details.writer ||
                  (details.cast && details.cast.length > 0)) && (
                  <div>
                    <h4 className="section-title">Details</h4>
                    <div className="space-y-2">
                      {details.cast && details.cast.length > 0 && (
                        <div className="text-sm">
                          <span className="metadata-label">Cast:</span>{" "}
                          <span className="metadata-value">
                            {details.cast.slice(0, 10).join(", ")}
                          </span>
                        </div>
                      )}
                      {details.director && (
                        <div className="text-sm">
                          <span className="metadata-label">
                            {mediaType === "tv" ? "Creator:" : "Director:"}
                          </span>{" "}
                          <span className="metadata-value">
                            {details.director}
                          </span>
                        </div>
                      )}
                      {details.producer && (
                        <div className="text-sm">
                          <span className="metadata-label">Producer:</span>{" "}
                          <span className="metadata-value">
                            {details.producer}
                          </span>
                        </div>
                      )}
                      {details.cinematographer && (
                        <div className="text-sm">
                          <span className="metadata-label">
                            Cinematographer:
                          </span>{" "}
                          <span className="metadata-value">
                            {details.cinematographer}
                          </span>
                        </div>
                      )}
                      {details.writer && (
                        <div className="text-sm">
                          <span className="metadata-label">Writer:</span>{" "}
                          <span className="metadata-value">
                            {details.writer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Reviews and Success */}
              <div className="space-y-4">
                {/* Reviews Section */}
                {(details.rotten_tomatoes_score ||
                  details.metacritic_score ||
                  details.imdb_rating) && (
                  <div>
                    <h4 className="section-title">Reviews</h4>
                    <div className="space-y-2">
                      {details.rotten_tomatoes_score && (
                        <div className="text-sm">
                          <span className="metadata-label">
                            Rotten Tomatoes:
                          </span>{" "}
                          <span className="metadata-value">
                            {details.rotten_tomatoes_score}
                          </span>
                        </div>
                      )}
                      {details.metacritic_score && (
                        <div className="text-sm">
                          <span className="metadata-label">Metacritic:</span>{" "}
                          <span className="metadata-value">
                            {details.metacritic_score}
                          </span>
                        </div>
                      )}
                      {details.imdb_rating && (
                        <div className="text-sm">
                          <span className="metadata-label">IMDB:</span>{" "}
                          <span className="metadata-value">
                            {details.imdb_rating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Section (Awards + Box Office) */}
                {(details.awards_text || details.box_office) && (
                  <div>
                    <h4 className="section-title">Success</h4>
                    <div className="flex flex-wrap gap-2">
                      {details.box_office && (
                        <span className="px-2.5 py-1 text-xs rounded-md border font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                          {details.box_office}
                        </span>
                      )}
                      {details.awards_text &&
                        parseAwards(details.awards_text).map((award, index) => (
                          <span
                            key={index}
                            className={`px-2.5 py-1 text-xs rounded-md border font-medium ${getAwardChipStyle(
                              award
                            )}`}
                          >
                            {award}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
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
