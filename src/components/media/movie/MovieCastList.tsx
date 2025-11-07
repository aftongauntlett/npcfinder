import { useState } from "react";
import { Users as UsersIcon, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../../shared/Button";

interface MovieCastListProps {
  cast: string[];
  initialDisplayCount?: number;
}

export function MovieCastList({
  cast,
  initialDisplayCount = 8,
}: MovieCastListProps) {
  const [showAll, setShowAll] = useState(false);

  if (cast.length === 0) return null;

  const displayedCast = showAll ? cast : cast.slice(0, initialDisplayCount);

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
        <UsersIcon className="w-4 h-4" aria-hidden="true" />
        Cast
      </h3>
      <div className="flex flex-wrap gap-2" role="list">
        {displayedCast.map((actor, index) => (
          <span
            key={index}
            role="listitem"
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700"
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
          className="mt-3"
        >
          {showAll ? "Show less" : `See all ${cast.length} actors`}
        </Button>
      )}
    </div>
  );
}
