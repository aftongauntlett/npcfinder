/**
 * iTunes Search API Integration
 *
 * Free music search API - NO authentication required!
 * Search for songs, albums, and artists.
 */

const ITUNES_SEARCH_BASE = "https://itunes.apple.com/search";
const ITUNES_LOOKUP_BASE = "https://itunes.apple.com/lookup";

export interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string; // Album name
  artworkUrl100: string;
  artworkUrl60: string;
  releaseDate: string;
  primaryGenreName: string;
  trackTimeMillis: number;
  previewUrl: string;
  trackViewUrl: string; // Link to iTunes
  collectionId: number;
  kind: "song" | "album";
}

export interface iTunesAlbum {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100: string;
  releaseDate: string;
  primaryGenreName: string;
  trackCount: number;
  collectionViewUrl: string; // Link to iTunes
  kind: "album";
}

export interface iTunesArtist {
  artistId: number;
  artistName: string;
  primaryGenreName: string;
  artistLinkUrl: string;
  kind: "artist";
}

export interface iTunesSearchResponse {
  resultCount: number;
  results: (iTunesTrack | iTunesAlbum | iTunesArtist)[];
}

/**
 * Search iTunes catalog
 * @param term - Search query
 * @param media - Type of media (music, movie, etc.)
 * @param entity - Specific entity type (song, album, musicArtist, etc.)
 * @param limit - Number of results (default 25, max 200)
 */
export async function searchItunes(
  term: string,
  entity: "song" | "album" | "allArtist" | "musicArtist" = "song",
  limit = 25
): Promise<iTunesSearchResponse> {
  const params = new URLSearchParams({
    term,
    media: "music",
    entity,
    limit: limit.toString(),
    country: "US", // Change to your country code if needed
  });

  const response = await fetch(`${ITUNES_SEARCH_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search for songs
 */
export async function searchSongs(
  query: string,
  limit = 25
): Promise<iTunesTrack[]> {
  const response = await searchItunes(query, "song", limit);
  return response.results as iTunesTrack[];
}

/**
 * Search for albums
 */
export async function searchAlbums(
  query: string,
  limit = 25
): Promise<iTunesAlbum[]> {
  const response = await searchItunes(query, "album", limit);
  return response.results as iTunesAlbum[];
}

/**
 * Search for artists
 */
export async function searchArtists(
  query: string,
  limit = 25
): Promise<iTunesArtist[]> {
  const response = await searchItunes(query, "musicArtist", limit);
  return response.results as iTunesArtist[];
}

/**
 * Search all music types
 */
export async function searchMusic(query: string, limit = 25) {
  const [songs, albums, artists] = await Promise.all([
    searchSongs(query, Math.ceil(limit / 3)),
    searchAlbums(query, Math.ceil(limit / 3)),
    searchArtists(query, Math.ceil(limit / 3)),
  ]);

  return {
    songs,
    albums,
    artists,
  };
}

/**
 * Lookup by iTunes ID
 */
export async function lookupById(id: number, entity: "song" | "album") {
  const params = new URLSearchParams({
    id: id.toString(),
    entity,
  });

  const response = await fetch(`${ITUNES_LOOKUP_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`iTunes lookup error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Helper to get higher resolution artwork
 * iTunes returns 100x100 by default, but you can request larger
 */
export function getHighResArtwork(artworkUrl: string, size = 600): string {
  return artworkUrl.replace("100x100", `${size}x${size}`);
}

/**
 * Helper to format track duration
 */
export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Helper to extract year from release date
 */
export function getYearFromReleaseDate(releaseDate: string): number {
  return new Date(releaseDate).getFullYear();
}
