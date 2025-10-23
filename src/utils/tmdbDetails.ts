/**
 * Fetch detailed movie/TV information from TMDB API
 * Includes: director, genres, ratings, runtime, awards
 */

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
  awards: string[];
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
  mediaType: "movie" | "tv"
): Promise<DetailedMediaInfo | null> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    console.error("TMDB API key not configured");
    return null;
  }

  try {
    // Fetch detailed information including credits
    const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${externalId}?api_key=${apiKey}&append_to_response=credits`;
    const response = await fetch(detailsUrl);

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieDetails = await response.json();

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

    // Extract ALL cast members (not just first 5)
    const cast = data.credits?.cast?.map((actor) => actor.name) || [];

    // Detect prestigious awards based on ratings and popularity
    // Note: TMDB doesn't provide Emmy/Oscar data directly, but we can infer quality
    const awards: string[] = [];
    const avgRating = data.vote_average || 0;
    const voteCount = data.vote_count || 0;

    if (avgRating >= 8.5 && voteCount >= 10000) {
      // Very high ratings with many votes often indicate award winners
      if (mediaType === "movie") {
        awards.push("Oscar-Worthy");
      } else {
        awards.push("Emmy-Worthy");
      }
    }
    if (avgRating >= 8.0 && voteCount >= 5000) {
      awards.push("Critically Acclaimed");
    }
    if (avgRating >= 7.5 && voteCount >= 20000) {
      awards.push("Fan Favorite");
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
      awards,
    };
  } catch (error) {
    console.error("Error fetching detailed media info:", error);
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

  // Process in batches to respect rate limits (40 requests per 10 seconds)
  const batchSize = 10;
  const delayMs = 300; // 300ms between requests

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        const details = await fetchDetailedMediaInfo(
          item.external_id,
          item.media_type
        );
        return { id: item.external_id, details };
      })
    );

    batchResults.forEach(({ id, details }) => {
      if (details) {
        results.set(id, details);
      }
    });
  }

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
    console.error("TMDB API key not configured");
    return [];
  }

  try {
    const url = `https://api.themoviedb.org/3/${mediaType}/${externalId}/similar?api_key=${apiKey}&page=1`;
    const response = await fetch(url);

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
    console.error("Error fetching similar media:", error);
    return [];
  }
}
