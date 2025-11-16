interface MediaMetricsProps {
  criticRatings?: {
    rottenTomatoes?: number;
    metacritic?: number;
    imdb?: number;
  };
  awards?: string;
  boxOffice?: string;
  className?: string;
}

export default function MediaMetrics({
  criticRatings,
  awards,
  boxOffice,
  className = "",
}: MediaMetricsProps) {
  const hasAnyMetric = criticRatings || awards || boxOffice;

  if (!hasAnyMetric) return null;

  return (
    <div className={className}>
      {/* Critic Ratings */}
      {criticRatings &&
        (criticRatings.rottenTomatoes ||
          criticRatings.metacritic ||
          criticRatings.imdb) && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Critic Ratings
            </h4>
            <div className="flex flex-wrap gap-4 m-0">
              {criticRatings.rottenTomatoes && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Rotten Tomatoes:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {criticRatings.rottenTomatoes}%
                  </span>
                </div>
              )}
              {criticRatings.metacritic && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Metacritic:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {criticRatings.metacritic}
                  </span>
                </div>
              )}
              {criticRatings.imdb && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    IMDB:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {criticRatings.imdb}/10
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Awards */}
      {awards && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Awards
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed m-0">
            {awards}
          </p>
        </div>
      )}

      {/* Box Office */}
      {boxOffice && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Box Office
          </h4>
          <p className="text-xl font-semibold text-gray-900 dark:text-white m-0">
            {boxOffice}
          </p>
        </div>
      )}
    </div>
  );
}
