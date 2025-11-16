import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Button from "./Button";

interface MediaCastListProps {
  cast: string[];
  initialDisplayCount?: number;
}

export function MediaCastList({
  cast,
  initialDisplayCount = 8,
}: MediaCastListProps) {
  const [showAll, setShowAll] = useState(false);

  if (cast.length === 0) return null;

  const displayedCast = showAll ? cast : cast.slice(0, initialDisplayCount);

  return (
    <div className="pb-5">
      <h3 className="text-sm font-medium text-primary mb-2.5 mt-0">Cast</h3>
      <div className="flex flex-wrap gap-2" role="list">
        {displayedCast.map((actor, index) => (
          <span
            key={index}
            role="listitem"
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-default"
          >
            {actor}
          </span>
        ))}
      </div>
      {cast.length > initialDisplayCount && (
        <Button
          onClick={() => setShowAll(!showAll)}
          variant="subtle"
          size="sm"
          icon={
            showAll ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )
          }
          className="mt-3 mb-0"
        >
          {showAll ? "Show less" : `See all ${cast.length} actors`}
        </Button>
      )}
    </div>
  );
}
