import React, { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, Star, Film } from "lucide-react";
import { SimilarMoviesCarousel } from "./SimilarMoviesCarousel";
import { useWatchlist } from "../../hooks/useWatchlistQueries";
import { useAddToWatchlist } from "../../hooks/useWatchlistQueries";
import { useTheme } from "../../hooks/useTheme";
import Toast from "../ui/Toast";
import {
  fetchTrendingMedia,
  fetchPopularMedia,
  fetchSimilarMedia,
  SimilarMediaItem,
} from "../../utils/tmdbDetails";

interface WatchlistAnalysis {
  favoriteMovie: {
    external_id: string;
    title: string;
    media_type: "movie" | "tv";
  } | null;
}

/**
 * MovieDiscoveryCard
 *
 * Matches the "From Friends" card styling but provides TMDB-based discovery:
 * - Trending This Week (collapsible)
 * - Popular Right Now (collapsible)
 * - Because You Watched (personalized, collapsible)
 * - From Directors You Like (personalized, collapsible)
 */
const MovieDiscoveryCard: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [trendingMovies, setTrendingMovies] = useState<SimilarMediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<SimilarMediaItem[]>([]);
  const [similarMovies, setSimilarMovies] = useState<SimilarMediaItem[]>([]);
  const [loadingSections, setLoadingSections] = useState<Set<string>>(
    new Set()
  );
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const { data: watchlist = [] } = useWatchlist();
  const addToWatchlistMutation = useAddToWatchlist();
  const { themeColor } = useTheme();

  // Get existing watchlist IDs to show "In List" badges
  const existingIds = watchlist.map((item) => item.external_id);

  // Analyze watchlist for personalized recommendations
  const analyzeWatchlist = (): WatchlistAnalysis => {
    let favoriteMovie: WatchlistAnalysis["favoriteMovie"] = null;

    // Find most recently watched item for "Because You Watched"
    const watchedItems = watchlist.filter((item) => item.watched);
    if (watchedItems.length > 0) {
      // Sort by watched_at descending, use most recent
      const sorted = [...watchedItems].sort((a, b) => {
        const dateA = a.watched_at ? new Date(a.watched_at).getTime() : 0;
        const dateB = b.watched_at ? new Date(b.watched_at).getTime() : 0;
        return dateB - dateA;
      });

      const mostRecent = sorted[0];
      if (mostRecent) {
        favoriteMovie = {
          external_id: mostRecent.external_id,
          title: mostRecent.title,
          media_type: mostRecent.media_type,
        };
      }
    }

    return { favoriteMovie };
  };

  const analysis = analyzeWatchlist();

  const toggleSection = async (section: string) => {
    // Toggle section in the set (allow multiple open)
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });

    // Load data on first expand
    if (!loadingSections.has(section)) {
      setLoadingSections((prev) => new Set(prev).add(section));

      try {
        if (section === "trending" && trendingMovies.length === 0) {
          const data = await fetchTrendingMedia("movie");
          setTrendingMovies(data);
        } else if (section === "popular" && popularMovies.length === 0) {
          const data = await fetchPopularMedia("movie");
          setPopularMovies(data);
        } else if (
          section === "similar" &&
          analysis.favoriteMovie &&
          similarMovies.length === 0
        ) {
          const data = await fetchSimilarMedia(
            analysis.favoriteMovie.external_id,
            analysis.favoriteMovie.media_type
          );
          setSimilarMovies(data);
        }
      } catch (error) {
        console.error(`Error loading ${section}:`, error);
      } finally {
        setLoadingSections((prev) => {
          const newSet = new Set(prev);
          newSet.delete(section);
          return newSet;
        });
      }
    }
  };

  const handleAddToWatchlist = async (movie: SimilarMediaItem) => {
    try {
      await addToWatchlistMutation.mutateAsync({
        external_id: movie.external_id,
        title: movie.title,
        media_type: movie.media_type,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
      });

      setToast({
        message: `Added "${movie.title}" to watchlist`,
      });
    } catch {
      setToast({
        message: "Failed to add to watchlist",
      });
    }
  };

  const sections = [
    {
      id: "trending",
      label: "Trending This Week",
      icon: TrendingUp,
      count: trendingMovies.length || "20",
      data: trendingMovies,
      enabled: true,
    },
    {
      id: "popular",
      label: "Popular Right Now",
      icon: Star,
      count: popularMovies.length || "20",
      data: popularMovies,
      enabled: true,
    },
    {
      id: "similar",
      label: analysis.favoriteMovie
        ? `Because You Watched "${analysis.favoriteMovie.title}"`
        : "Because You Watched",
      icon: Film,
      count: similarMovies.length || "20",
      data: similarMovies,
      enabled: !!analysis.favoriteMovie,
    },
    // Future: From Directors You Like
    // {
    //   id: "directors",
    //   label: "From Directors You Like",
    //   icon: DirectorIcon,
    //   count: 0,
    //   data: [],
    //   enabled: analysis.topDirectors.length > 0,
    // },
  ];

  const enabledSections = sections.filter((s) => s.enabled);

  if (enabledSections.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Discover
          </h2>
        </div>

        <div className="space-y-3">
          {enabledSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            const isLoading = loadingSections.has(section.id);

            return (
              <div
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => void toggleSection(section.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${themeColor}20`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {section.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {section.count} movies
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Loading...
                      </div>
                    ) : section.data.length > 0 ? (
                      <SimilarMoviesCarousel
                        movies={section.data}
                        onAddToWatchlist={(movie) =>
                          void handleAddToWatchlist(movie)
                        }
                        existingIds={existingIds}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No recommendations available
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
};

export default MovieDiscoveryCard;
