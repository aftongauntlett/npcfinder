/**
 * Fetch detailed movie/TV information from TMDB API + OMDB API
 * Includes: director, genres, ratings, runtime, awards, RT scores, Metacritic, Box Office
 */

import { tmdbLimiter, omdbLimiter } from "./rateLimiter";
import { logger } from "@/lib/logger";

function getEnvVar(key: string): string | undefined {
  // Vite runtime
  const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  if (viteEnv?.[key]) return viteEnv[key];

  // Node runtime (one-off scripts)
  const nodeEnv = (globalThis as unknown as { process?: { env?: Record<string, string> } })
    .process?.env;
  return nodeEnv?.[key];
}

interface OMDBResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

/**
 * Fetch OMDB data (Rotten Tomatoes, Metacritic, Awards, Box Office)
 */
async function fetchOMDBData(
  imdbId: string
): Promise<Partial<OMDBResponse> | null> {
  const apiKey = getEnvVar("VITE_OMDB_API_KEY");
  if (!apiKey) {
    logger.warn("OMDB API key not configured");
    return null;
  }

  try {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`;

    // Use rate limiter for OMDB requests
    const response = await omdbLimiter.add(() => fetch(url));

    if (!response.ok) {
      logger.error("OMDB API request failed", { status: response.status });
      return null;
    }

    const data: OMDBResponse = await response.json();

    if (data.Response === "False") {
      logger.warn("OMDB data not found", { imdbId });
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to fetch OMDB data", { error });
    return null;
  }
}

export interface DetailedMediaInfo {
  external_id: string;
  title: string;
  media_type: "movie" | "tv";
  poster_url: string | null;
  release_date: string | null;
  overview: string | null;
  director: string | null;
  producer: string | null;
  cinematographer: string | null;
  writer: string | null;
  cast: string[];
  genres: string[];
  vote_average: number | null;
  vote_count: number | null;
  runtime: number | null;
  // OMDB enriched data
  imdb_rating: string | null;
  rotten_tomatoes_score: string | null;
  metacritic_score: string | null;
  awards_text: string | null;
  box_office: string | null;
  imdb_id: string | null;
}

interface TMDBMovieDetails {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    crew?: Array<{ job: string; name: string }>;
    cast?: Array<{ name: string; character: string; order: number }>;
  };
  awards?: {
    wins?: number;
    nominations?: number;
  };
}

/**
 * Fetch detailed information for a specific movie/TV show
 */
export async function fetchDetailedMediaInfo(
  externalId: string,
  mediaType: "movie" | "tv",
  options?: {
    includeOmdb?: boolean;
  }
): Promise<DetailedMediaInfo | null> {
  const apiKey = getEnvVar("VITE_TMDB_API_KEY");
  if (!apiKey) {
    logger.error("TMDB API key not configured");
    return null;
  }

  const includeOmdb = options?.includeOmdb ?? true;

  try {
    // Fetch detailed information including credits and external_ids (for IMDb ID)
    const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${externalId}?api_key=${apiKey}&append_to_response=credits,external_ids`;

    // Use rate limiter for TMDB requests
    const response = await tmdbLimiter.add(() => fetch(detailsUrl));

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieDetails & {
      external_ids?: { imdb_id?: string };
    } = await response.json();

    // Extract director (for movies) or creator (for TV shows)
    let director: string | null = null;
    let producer: string | null = null;
    let cinematographer: string | null = null;
    let writer: string | null = null;

    if (data.credits?.crew) {
      if (mediaType === "movie") {
        director =
          data.credits.crew.find((c) => c.job === "Director")?.name || null;
        producer =
          data.credits.crew.find((c) => c.job === "Producer")?.name || null;
        cinematographer =
          data.credits.crew.find((c) => c.job === "Director of Photography")
            ?.name || null;
        writer =
          data.credits.crew.find(
            (c) => c.job === "Screenplay" || c.job === "Writer"
          )?.name || null;
      } else {
        // For TV shows
        director =
          data.credits.crew.find(
            (c) => c.job === "Creator" || c.job === "Executive Producer"
          )?.name || null;
        producer =
          data.credits.crew.find((c) => c.job === "Producer")?.name || null;
        cinematographer =
          data.credits.crew.find((c) => c.job === "Director of Photography")
            ?.name || null;
        writer =
          data.credits.crew.find((c) => c.job === "Writer")?.name || null;
      }
    }

    // Extract genres
    const genres = data.genres?.map((g) => g.name) || [];

    // Extract cast (cap for predictable DB/cache size)
    // UI currently displays only the first 10 names.
    const MAX_CACHED_CAST = 20;
    const cast = (data.credits?.cast || [])
      .map((actor) => actor.name)
      .slice(0, MAX_CACHED_CAST);

    // Fetch OMDB data if IMDb ID is available
    const imdbId = data.external_ids?.imdb_id;
    let omdbData: Partial<OMDBResponse> | null = null;

    if (includeOmdb && imdbId) {
      omdbData = await fetchOMDBData(imdbId);
    }

    // Extract ratings from OMDB
    let rottenTomatoesScore: string | null = null;
    let metacriticScore: string | null = null;

    if (omdbData?.Ratings) {
      const rtRating = omdbData.Ratings.find((r) =>
        r.Source.includes("Rotten Tomatoes")
      );
      if (rtRating) {
        // RT sometimes has format "95%" or "Fresh 95%"
        const match = rtRating.Value.match(/(\d+)%/);
        if (match) {
          rottenTomatoesScore = match[1];
        }
      }

      const metacriticRating = omdbData.Ratings.find((r) =>
        r.Source.includes("Metacritic")
      );
      if (metacriticRating) {
        // Metacritic format is "85/100"
        const match = metacriticRating.Value.match(/(\d+)/);
        if (match) {
          metacriticScore = match[1];
        }
      }
    }

    return {
      external_id: String(data.id),
      title: data.title || data.name || "Unknown Title",
      media_type: mediaType,
      poster_url: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      release_date: data.release_date || data.first_air_date || null,
      overview: data.overview || null,
      director,
      producer,
      cinematographer,
      writer,
      cast,
      genres,
      vote_average: data.vote_average || null,
      vote_count: data.vote_count || null,
      runtime: data.runtime || null,
      // OMDB enriched data
      imdb_rating: omdbData?.imdbRating || null,
      rotten_tomatoes_score: rottenTomatoesScore,
      metacritic_score: metacriticScore,
      awards_text: omdbData?.Awards || null,
      box_office: omdbData?.BoxOffice || null,
      imdb_id: imdbId || null,
    };
  } catch (error) {
    logger.error("Failed to fetch detailed media info", {
      error,
      externalId,
      mediaType,
    });
    return null;
  }
}

/**
 * Batch fetch details for multiple items (with rate limiting)
 */
export async function fetchMultipleMediaDetails(
  items: Array<{ external_id: string; media_type: "movie" | "tv" }>
): Promise<Map<string, DetailedMediaInfo>> {
  const results = new Map<string, DetailedMediaInfo>();

  // Fire all requests concurrently; internal rate limiters handle pacing.
  // Include OMDB during prefetch so expanded details have awards/ratings.
  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const details = await fetchDetailedMediaInfo(item.external_id, item.media_type, {
        includeOmdb: true,
      });
      return { id: item.external_id, details };
    })
  );

  settled.forEach((result) => {
    if (result.status !== "fulfilled") return;
    const { id, details } = result.value;
    if (details) results.set(id, details);
  });

  return results;
}

/**
 * Fetch similar movies/TV shows
 */
export interface SimilarMediaItem {
  external_id: string;
  title: string;
  media_type: "movie" | "tv";
  poster_url: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
}

export async function fetchSimilarMedia(
  externalId: string,
  mediaType: "movie" | "tv",
  limit: number = 10
): Promise<SimilarMediaItem[]> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    logger.error("TMDB API key not configured");
    return [];
  }

  try {
    const url = `https://api.themoviedb.org/3/${mediaType}/${externalId}/similar?api_key=${apiKey}&page=1`;

    // Use rate limiter for TMDB requests
    const response = await tmdbLimiter.add(() => fetch(url));

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []) as TMDBMovieDetails[];

    return results.slice(0, limit).map((item) => ({
      external_id: String(item.id),
      title: item.title || item.name || "Unknown Title",
      media_type: mediaType,
      poster_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      release_date: item.release_date || item.first_air_date || null,
      vote_average: item.vote_average || null,
      overview: item.overview || null,
    }));
  } catch (error) {
    logger.error("Failed to fetch similar media", {
      error,
      externalId,
      mediaType,
    });
    return [];
  }
}

/**
 * Fetch trending movies/TV shows
 */
export async function fetchTrendingMedia(
  mediaType: "movie" | "tv" | "all" = "all",
  timeWindow: "day" | "week" = "week",
  limit: number = 20
): Promise<SimilarMediaItem[]> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    logger.error("TMDB API key not configured");
    return [];
  }

  try {
    const url = `https://api.themoviedb.org/3/trending/${mediaType}/${timeWindow}?api_key=${apiKey}`;

    // Use rate limiter for TMDB requests
    const response = await tmdbLimiter.add(() => fetch(url));

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []) as TMDBMovieDetails[];

    return results.slice(0, limit).map((item) => ({
      external_id: String(item.id),
      title: item.title || item.name || "Unknown Title",
      media_type: item.title ? "movie" : "tv",
      poster_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      release_date: item.release_date || item.first_air_date || null,
      vote_average: item.vote_average || null,
      overview: item.overview || null,
    }));
  } catch (error) {
    logger.error("Failed to fetch trending media", {
      error,
      mediaType,
      timeWindow,
    });
    return [];
  }
}

/**
 * Fetch popular movies/TV shows
 */
export async function fetchPopularMedia(
  mediaType: "movie" | "tv" = "movie",
  limit: number = 20
): Promise<SimilarMediaItem[]> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    logger.error("TMDB API key not configured");
    return [];
  }

  try {
    const url = `https://api.themoviedb.org/3/${mediaType}/popular?api_key=${apiKey}&page=1`;

    // Use rate limiter for TMDB requests
    const response = await tmdbLimiter.add(() => fetch(url));

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []) as TMDBMovieDetails[];

    return results.slice(0, limit).map((item) => ({
      external_id: String(item.id),
      title: item.title || item.name || "Unknown Title",
      media_type: mediaType,
      poster_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      release_date: item.release_date || item.first_air_date || null,
      vote_average: item.vote_average || null,
      overview: item.overview || null,
    }));
  } catch (error) {
    logger.error("Failed to fetch popular media", { error, mediaType });
    return [];
  }
}
