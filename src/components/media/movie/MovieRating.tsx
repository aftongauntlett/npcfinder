interface MovieRatingProps {
  rottenTomatoesScore?: string | null;
  metacriticScore?: string | null;
  imdbRating?: string | null;
}

export function MovieRating({
  rottenTomatoesScore,
  metacriticScore,
  imdbRating,
}: MovieRatingProps) {
  // If no ratings available, don't render anything
  if (!rottenTomatoesScore && !metacriticScore && !imdbRating) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* Rotten Tomatoes Score */}
      {rottenTomatoesScore && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Rotten Tomatoes
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              {rottenTomatoesScore}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
          </div>
        </div>
      )}

      {/* Metacritic Score */}
      {metacriticScore && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Metacritic
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metacriticScore}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              /100
            </span>
          </div>
        </div>
      )}

      {/* IMDb Rating */}
      {imdbRating && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            IMDb
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              {imdbRating}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              /10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
