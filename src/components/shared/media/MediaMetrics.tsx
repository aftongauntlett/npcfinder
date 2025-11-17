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
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-5 ${className}`}
    >
      {/* Critic Ratings */}
      {criticRatings &&
        (criticRatings.rottenTomatoes ||
          criticRatings.metacritic ||
          criticRatings.imdb) && (
          <div>
            <h4 className="text-sm font-medium text-primary mb-2.5 mt-0">
              Critic Ratings
            </h4>
            <div className="space-y-2">
              {criticRatings.rottenTomatoes && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Rotten Tomatoes:
                  </span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {criticRatings.rottenTomatoes}%
                  </span>
                </div>
              )}
              {criticRatings.metacritic && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Metacritic:
                  </span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {criticRatings.metacritic}
                  </span>
                </div>
              )}
              {criticRatings.imdb && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    IMDB:
                  </span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {criticRatings.imdb}/10
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Awards */}
      {awards && (
        <div>
          <h4 className="text-sm font-medium text-primary mb-2.5 mt-0">
            Awards
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed m-0">
            {awards}
          </p>
        </div>
      )}

      {/* Box Office */}
      {boxOffice && (
        <div>
          <h4 className="text-sm font-medium text-primary mb-2.5 mt-0">
            Box Office
          </h4>
          <p className="text-base font-semibold text-gray-900 dark:text-white m-0">
            {boxOffice}
          </p>
        </div>
      )}
    </div>
  );
}
