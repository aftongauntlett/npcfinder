import { MediaItem } from "@/components/shared";
import { tmdbLimiter, itunesLimiter } from "./rateLimiter";
import { logger } from "@/lib/logger";

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
  trackTimeMillis?: number;
  trackCount?: number;
  previewUrl?: string;
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

const SEARCH_RESULT_CAP = 5;

function normalizeForDedupe(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function sanitizeYear(
  rawYear: string | null | undefined,
  options?: {
    minYear?: number;
  },
): string | null {
  if (!rawYear) {
    return null;
  }

  const trimmed = rawYear.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    return null;
  }

  const year = Number(trimmed);
  const maxYear = new Date().getFullYear() + 1;

  if (year > maxYear) {
    return null;
  }

  if (options?.minYear !== undefined && year < options.minYear) {
    return null;
  }

  return String(year);
}

function sanitizeYearFromReleaseDate(
  releaseDate: string | null | undefined,
): string | null {
  if (!releaseDate) {
    return null;
  }

  const yearPrefix = releaseDate.match(/^(\d{4})/)?.[1] || null;
  return sanitizeYear(yearPrefix);
}

/**
 * Search iTunes API and convert results to generic MediaItem format
 */
export async function searchMusic(query: string): Promise<MediaItem[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query,
  )}&limit=25&media=music`;

  // Use rate limiter for iTunes requests
  const response = await itunesLimiter.add(() => fetch(url));
  const data: iTunesResponse = await response.json();

  return data.results
    .filter((item) => item.wrapperType !== "artist")
    .map((item) => {
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
        track_duration: item.trackTimeMillis || null,
        track_count: item.trackCount || null,
        preview_url: item.previewUrl || null,
      };
    });
}

/**
 * Search TMDB API and convert results to generic MediaItem format
 */
export async function searchMoviesAndTV(query: string): Promise<MediaItem[]> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    logger.error("TMDB API key not configured");
    return [];
  }

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
    query,
  )}&include_adult=false`;

  // Use rate limiter for TMDB requests
  const response = await tmdbLimiter.add(() => fetch(url));
  const data: TMDBResponse = await response.json();

  const filtered = data.results
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .filter((item) => Boolean(item.poster_path));

  return filtered.slice(0, SEARCH_RESULT_CAP).map((item) => {
    const rawReleaseDate = item.release_date || item.first_air_date || null;
    const sanitizedYear = sanitizeYearFromReleaseDate(rawReleaseDate);

    return {
      external_id: String(item.id),
      title: item.title || item.name || "Unknown Title",
      subtitle: item.media_type === "movie" ? "Movie" : "TV Show",
      poster_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : null,
      release_date: sanitizedYear ? rawReleaseDate : null,
      description: item.overview || null,
      media_type: item.media_type,
    };
  });
}

/**
 * Placeholder search function for Books
 * Note: The actual implementation exists in utils/bookSearchAdapters.ts
 * This function is kept for backwards compatibility but should not be used.
 * Import searchBooks from '@/utils/bookSearchAdapters' instead.
 */
export function searchBooks(query: string): Promise<MediaItem[]> {
  logger.warn(
    "Deprecated: Use searchBooks from bookSearchAdapters.ts instead",
    { query },
  );
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
  added_by_status?: Record<string, number | undefined>;
  platforms?: RAWGPlatform[];
  genres?: RAWGGenre[];
  rating?: number;
  rating_count?: number;
  metacritic?: number;
  playtime?: number;
}

interface RAWGGameDetails extends RAWGResult {
  description_raw?: string;
}

interface RAWGResponse {
  results: RAWGResult[];
}

function addedByStatusSuggestsNonBaseGame(
  addedByStatus?: Record<string, number | undefined>,
): boolean {
  if (!addedByStatus) {
    return false;
  }

  const nonBaseStatusKeys = [
    "dlc",
    "expansion",
    "expansions",
    "addon",
    "add-on",
    "addons",
    "add-ons",
    "bundle",
    "bundles",
    "pack",
    "packs",
    "edition",
    "editions",
  ];

  return nonBaseStatusKeys.some((key) => {
    const count = addedByStatus[key];
    return typeof count === "number" && count > 0;
  });
}

function nameSuggestsNonBaseGame(name: string): boolean {
  return /\s-\s|(^|\W)(dlc|expansion|pack|bundle|edition)(\W|$)/i.test(name);
}

function dedupeRawgResultsByName(results: RAWGResult[]): RAWGResult[] {
  const deduped = new Map<string, RAWGResult>();

  for (const game of results) {
    const dedupeKey = normalizeForDedupe(game.name || "");
    if (!dedupeKey) {
      continue;
    }

    const existing = deduped.get(dedupeKey);
    if (!existing) {
      deduped.set(dedupeKey, game);
      continue;
    }

    const existingRatingCount = existing.rating_count || 0;
    const incomingRatingCount = game.rating_count || 0;

    if (incomingRatingCount > existingRatingCount) {
      deduped.set(dedupeKey, game);
    }
  }

  return Array.from(deduped.values());
}

/**
 * Search RAWG API and convert results to generic MediaItem format
 */
export async function searchGames(query: string): Promise<MediaItem[]> {
  const apiKey = import.meta.env.VITE_RAWG_API_KEY;
  if (!apiKey) {
    logger.error("RAWG API key not configured");
    return [];
  }

  const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(
    query,
  )}&page_size=20`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }

    const data: RAWGResponse = await response.json();

    const imageAndDateFiltered = data.results.filter(
      (game) => Boolean(game.background_image) && Boolean(game.released),
    );

    const deduped = dedupeRawgResultsByName(imageAndDateFiltered);

    const baseGameFiltered = deduped.filter((game) => {
      const nonBaseByStatus = addedByStatusSuggestsNonBaseGame(
        game.added_by_status,
      );
      const nonBaseByName = nameSuggestsNonBaseGame(game.name || "");
      return !nonBaseByStatus && !nonBaseByName;
    });

    const gamesToMap =
      baseGameFiltered.length > 0
        ? baseGameFiltered
        : deduped.length === 1
          ? deduped
          : [];

    return gamesToMap.slice(0, SEARCH_RESULT_CAP).map((game) => ({
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
    logger.error("Failed to search games", { error, query });
    return [];
  }
}

/**
 * Fetch detailed game information from RAWG API
 */
export async function fetchGameDetails(
  gameId: string,
): Promise<RAWGGameDetails | null> {
  const apiKey = import.meta.env.VITE_RAWG_API_KEY;
  if (!apiKey) {
    logger.error("RAWG API key not configured");
    return null;
  }

  const url = `https://api.rawg.io/api/games/${gameId}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }

    const data: RAWGGameDetails = await response.json();
    return data;
  } catch (error) {
    logger.error("Failed to fetch game details", { error, gameId });
    return null;
  }
}
