import Accordion from "../common/Accordion";
import { MediaCrewInfo } from "./MediaCrewInfo";
import MediaMetrics from "./MediaMetrics";
import { MediaCastList } from "./MediaCastList";

interface MediaDetailsAccordionProps {
  // Crew props
  director?: string | null;
  producer?: string | null;
  cinematographer?: string | null;
  writer?: string | null;
  mediaType?: "movie" | "tv";
  // Cast
  cast?: string[];
  // Metrics props
  criticRatings?: {
    rottenTomatoes?: number;
    metacritic?: number;
    imdb?: number;
  };
  awards?: string;
  boxOffice?: string;
  // Book/Game/Music specific
  publisher?: string;
  developer?: string;
  platforms?: string;
  releaseDate?: string;
  pageCount?: number;
  isbn?: string;
  className?: string;
}

/**
 * MediaDetailsAccordion - Collapsible details section for media metadata
 *
 * Wraps crew info, ratings, awards, and other metadata in an accordion
 * to reduce vertical space and improve scanability.
 */
export default function MediaDetailsAccordion({
  director,
  producer,
  cinematographer,
  writer,
  mediaType = "movie",
  cast,
  criticRatings,
  awards,
  boxOffice,
  publisher,
  developer,
  platforms,
  releaseDate,
  pageCount,
  isbn,
  className = "",
}: MediaDetailsAccordionProps) {
  // Check if we have any content to display
  const hasCrewInfo = director || producer || cinematographer || writer;
  const hasCast = cast && cast.length > 0;
  const hasMetrics = criticRatings || awards || boxOffice;
  const hasBookDetails = publisher || releaseDate || pageCount || isbn;
  const hasGameDetails = developer || platforms;

  const hasAnyContent =
    hasCrewInfo || hasCast || hasMetrics || hasBookDetails || hasGameDetails;

  if (!hasAnyContent) return null;

  return (
    <Accordion
      title="Details"
      subtitle="Production info, ratings, and more"
      variant="compact"
      className={className}
    >
      <div className="p-4 space-y-4">
        {/* Crew Info for Movies/TV */}
        {hasCrewInfo && (
          <MediaCrewInfo
            director={director}
            producer={producer}
            cinematographer={cinematographer}
            writer={writer}
            mediaType={mediaType}
          />
        )}

        {/* Cast for Movies/TV */}
        {hasCast && <MediaCastList cast={cast} />}

        {/* Metrics for Movies/TV */}
        {hasMetrics && (
          <MediaMetrics
            criticRatings={criticRatings}
            awards={awards}
            boxOffice={boxOffice}
          />
        )}

        {/* Book Details */}
        {hasBookDetails && (
          <div className="grid grid-cols-2 gap-4">
            {publisher && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                  Publisher
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {publisher}
                </div>
              </div>
            )}
            {releaseDate && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                  Published
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {releaseDate}
                </div>
              </div>
            )}
            {pageCount && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                  Pages
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pageCount}
                </div>
              </div>
            )}
            {isbn && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                  ISBN
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isbn}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Details */}
        {hasGameDetails && (
          <div className="grid grid-cols-2 gap-4">
            {developer && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                  Developer
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {developer}
                </div>
              </div>
            )}
            {platforms && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                  Platforms
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {platforms}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Accordion>
  );
}
