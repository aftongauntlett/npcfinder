import React from "react";
import { Plus, Star } from "lucide-react";
import type { SimilarMediaItem } from "../../utils/tmdbDetails";
import { formatReleaseYear } from "../../utils/dateFormatting";

interface SimilarMoviesCarouselProps {
  movies: SimilarMediaItem[];
  onAddToWatchlist: (movie: SimilarMediaItem) => void;
  existingIds: string[];
}

export const SimilarMoviesCarousel: React.FC<SimilarMoviesCarouselProps> = ({
  movies,
  onAddToWatchlist,
  existingIds,
}) => {
  if (movies.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        More Like This
      </h3>
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex gap-4 pb-4">
          {movies.map((movie) => {
            const isInWatchlist = existingIds.includes(movie.external_id);

            return (
              <div key={movie.external_id} className="flex-shrink-0 w-32 group">
                {/* Poster */}
                <div className="relative mb-2">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-48 object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        No Image
                      </span>
                    </div>
                  )}

                  {/* Add button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isInWatchlist) {
                        onAddToWatchlist(movie);
                      }
                    }}
                    disabled={isInWatchlist}
                    className={`absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                      isInWatchlist ? "cursor-default" : ""
                    }`}
                    title={
                      isInWatchlist
                        ? "Already in watchlist"
                        : "Add to watchlist"
                    }
                  >
                    {isInWatchlist ? (
                      <span className="text-white text-xs font-medium px-3 py-1.5 bg-gray-700 rounded-full">
                        In List
                      </span>
                    ) : (
                      <div className="bg-primary hover:bg-primary/90 text-white rounded-full p-2 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Title and info */}
                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 leading-tight">
                  {movie.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {movie.release_date && (
                    <span>{formatReleaseYear(movie.release_date)}</span>
                  )}
                  {movie.vote_average && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
