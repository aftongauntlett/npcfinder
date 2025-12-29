import { useState } from "react";

interface MediaCastListProps {
  cast: string[];
  initialDisplayCount?: number;
}

export function MediaCastList({
  cast,
  initialDisplayCount = 9,
}: MediaCastListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (cast.length === 0) return null;

  // Show first 9, then "See more" as 10th chip, or "See less" if expanded
  const displayedCast = isExpanded ? cast : cast.slice(0, initialDisplayCount);
  const hasMore = cast.length > initialDisplayCount;

  return (
    <div>
      <h4 className="metadata-label mb-2">Cast</h4>
      <div className="flex flex-wrap gap-2" role="list">
        {displayedCast.map((actor, index) => (
          <span
            key={`${actor}-${index}`}
            role="listitem"
            className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 cursor-default"
          >
            {actor}
          </span>
        ))}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 text-xs bg-primary/10 dark:bg-primary/20 text-primary rounded-md border border-primary/30 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors duration-200 cursor-pointer font-medium"
          >
            {isExpanded
              ? "See less"
              : `See more (${cast.length - initialDisplayCount})`}
          </button>
        )}
      </div>
    </div>
  );
}
