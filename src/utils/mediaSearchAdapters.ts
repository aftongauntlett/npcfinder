import { MediaItem } from "../components/shared/SendMediaModal";

// iTunes API response types
interface iTunesResult {
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  wrapperType: string;
}

interface iTunesResponse {
  results: iTunesResult[];
}

// TMDB API response types
interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
}

interface TMDBResponse {
  results: TMDBResult[];
}

/**
 * Search iTunes API and convert results to generic MediaItem format
 */
export async function searchMusic(query: string): Promise<MediaItem[]> {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&limit=25&media=music`
  );
  const data: iTunesResponse = await response.json();

  return data.results.map((item) => ({
    external_id: String(item.trackId || item.collectionId),
    title: item.trackName || item.collectionName || "Unknown Title",
    subtitle: item.artistName,
    poster_url: item.artworkUrl100 || null,
    release_date: item.releaseDate || null,
    media_type: item.wrapperType,
  }));
}

/**
 * Search TMDB API and convert results to generic MediaItem format
 */
export async function searchMoviesAndTV(query: string): Promise<MediaItem[]> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    console.error("TMDB API key not configured");
    return [];
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
      query
    )}&include_adult=false`
  );
  const data: TMDBResponse = await response.json();

  return data.results
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map((item) => ({
      external_id: String(item.id),
      title: item.title || item.name || "Unknown Title",
      subtitle: item.media_type === "movie" ? "Movie" : "TV Show",
      poster_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : null,
      release_date: item.release_date || item.first_air_date || null,
      description: item.overview || null,
      media_type: item.media_type,
    }));
}

/**
 * Placeholder search function for Books (to be implemented with Google Books API or similar)
 */
export function searchBooks(query: string): Promise<MediaItem[]> {
  // TODO: Implement with Google Books API
  console.warn("Books search not yet implemented:", query);
  return Promise.resolve([]);
}

/**
 * Placeholder search function for Games (to be implemented with IGDB API or similar)
 */
export function searchGames(query: string): Promise<MediaItem[]> {
  // TODO: Implement with IGDB API or similar
  console.warn("Games search not yet implemented:", query);
  return Promise.resolve([]);
}
