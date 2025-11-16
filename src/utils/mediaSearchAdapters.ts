import { MediaItem } from "@/components/shared";
import { tmdbLimiter, itunesLimiter } from "./rateLimiter";

// iTunes API response types
interface iTunesResult {
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  primaryGenreName?: string;
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
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query
  )}&limit=25&media=music`;

  // Use rate limiter for iTunes requests
  const response = await itunesLimiter.add(() => fetch(url));
  const data: iTunesResponse = await response.json();

  return data.results.map((item) => {
    // Map iTunes wrapperType to our media_type
    // iTunes returns: "track", "collection", "artist"
    // We want: "song", "album", "playlist"
    let mediaType: "song" | "album" | "playlist" = "song";
    if (item.wrapperType === "collection") {
      mediaType = "album";
    } else if (item.wrapperType === "track") {
      mediaType = "song";
    }

    return {
      external_id: String(item.trackId || item.collectionId),
      title: item.trackName || item.collectionName || "Unknown Title",
      subtitle: item.artistName,
      artist: item.artistName,
      album: item.collectionName,
      poster_url: item.artworkUrl100 || null,
      release_date: item.releaseDate || null,
      media_type: mediaType,
      genre: item.primaryGenreName || null,
    };
  });
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

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
    query
  )}&include_adult=false`;

  // Use rate limiter for TMDB requests
  const response = await tmdbLimiter.add(() => fetch(url));
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

// RAWG API response types
interface RAWGPlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

interface RAWGGenre {
  id: number;
  name: string;
  slug: string;
}

interface RAWGResult {
  id: number;
  slug: string;
  name: string;
  released?: string;
  background_image?: string;
  platforms?: RAWGPlatform[];
  genres?: RAWGGenre[];
  rating?: number;
  metacritic?: number;
  playtime?: number;
}

interface RAWGResponse {
  results: RAWGResult[];
}

/**
 * Search RAWG API and convert results to generic MediaItem format
 */
export async function searchGames(query: string): Promise<MediaItem[]> {
  const apiKey = import.meta.env.VITE_RAWG_API_KEY;
  if (!apiKey) {
    console.error("RAWG API key not configured");
    return [];
  }

  const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(
    query
  )}&page_size=25`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }

    const data: RAWGResponse = await response.json();

    return data.results.map((game) => ({
      external_id: String(game.id),
      title: game.name || "Unknown Game",
      subtitle: game.platforms
        ?.map((p) => p.platform.name)
        .slice(0, 3)
        .join(", "),
      poster_url: game.background_image || null,
      release_date: game.released || null,
      description: game.genres?.map((g) => g.name).join(", ") || null,
      media_type: "game",
      // Additional game-specific fields for SendMediaModal
      slug: game.slug,
      platforms: game.platforms?.map((p) => p.platform.name).join(", "),
      genres: game.genres?.map((g) => g.name).join(", "),
      rating: game.rating,
      metacritic: game.metacritic,
      playtime: game.playtime,
    }));
  } catch (error) {
    console.error("Failed to search games:", error);
    return [];
  }
}
