import { useState, useEffect } from "react";
import { TrendingUp, Star as StarIcon, Sparkles } from "lucide-react";
import { SimilarMoviesCarousel } from "./SimilarMoviesCarousel";
import {
  fetchTrendingMedia,
  fetchPopularMedia,
  type SimilarMediaItem,
} from "../../utils/tmdbDetails";
import {
  useWatchlist,
  useAddToWatchlist,
} from "../../hooks/useWatchlistQueries";

export function DiscoverMovies() {
  const [trending, setTrending] = useState<SimilarMediaItem[]>([]);
  const [popular, setPopular] = useState<SimilarMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: watchList = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();

  useEffect(() => {
    const loadDiscoverData = async () => {
      setLoading(true);
      try {
        const [trendingData, popularData] = await Promise.all([
          fetchTrendingMedia("all", "week", 15),
          fetchPopularMedia("movie", 15),
        ]);
        setTrending(trendingData);
        setPopular(popularData);
      } catch (error) {
        console.error("Error loading discover data:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadDiscoverData();
  }, []);

  const handleAddToWatchlist = async (movie: SimilarMediaItem) => {
    await addToWatchlist.mutateAsync({
      external_id: movie.external_id,
      title: movie.title,
      media_type: movie.media_type,
      poster_url: movie.poster_url,
      release_date: movie.release_date,
      overview: movie.overview,
      watched: false,
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Loading recommendations...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Discover
        </h2>
      </div>

      {/* Trending This Week */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trending This Week
            </h3>
          </div>
          <SimilarMoviesCarousel
            movies={trending}
            onAddToWatchlist={(movie) => void handleAddToWatchlist(movie)}
            existingIds={watchList.map((item) => item.external_id)}
          />
        </div>
      )}

      {/* Popular Movies */}
      {popular.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <StarIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Popular Right Now
            </h3>
          </div>
          <SimilarMoviesCarousel
            movies={popular}
            onAddToWatchlist={(movie) => void handleAddToWatchlist(movie)}
            existingIds={watchList.map((item) => item.external_id)}
          />
        </div>
      )}
    </div>
  );
}
