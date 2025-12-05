import React, { useState } from "react";
import { TrendingUp, Star, Film } from "lucide-react";
import DiscoverySection from "./DiscoverySection";
import { logger } from "@/lib/logger";
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

// TMDB-based discovery card: trending, popular, and personalized recommendations
// Matches "From Friends" card styling with collapsible sections
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
        logger.error(`Failed to load ${section} movies`, error);
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
          {enabledSections.map((section) => (
            <DiscoverySection
              key={section.id}
              id={section.id}
              label={section.label}
              icon={section.icon}
              count={section.count}
              data={section.data}
              isExpanded={expandedSections.has(section.id)}
              isLoading={loadingSections.has(section.id)}
              themeColor={themeColor}
              existingIds={existingIds}
              onToggle={() => void toggleSection(section.id)}
              onAddToWatchlist={(movie) => void handleAddToWatchlist(movie)}
            />
          ))}
        </div>
      </div>

      {/* Success notification Toast (NOT for delete operations) */}
      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
};

export default MovieDiscoveryCard;
