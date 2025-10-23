import { Star } from "lucide-react";

interface MovieRatingProps {
  rating: number;
  voteCount?: number;
}

export function MovieRating({ rating, voteCount }: MovieRatingProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Star
          className="w-4 h-4 text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        />
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {rating.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/ 10</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          TMDB
        </span>
      </div>
      {voteCount && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {voteCount.toLocaleString()} votes
        </span>
      )}
    </div>
  );
}
