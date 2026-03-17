import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { DetailedMediaInfo } from "@/utils/tmdbDetails";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 180; // 180 days (mostly static)

export type MediaType =
  | "movie"
  | "tv"
  | "book"
  | "game"
  | "song"
  | "album"
  | "playlist";

export interface BookDetailedInfo {
  external_id: string;
  media_type: "book";
  title: string;
  authors: string | null;
  poster_url: string | null;
  release_date: string | null;
  description: string | null;
  page_count: number | null;
  categories: string | null;
  publisher: string | null;
  isbn: string | null;
  average_rating: number | null;
}

export interface GameDetailedInfo {
  external_id: string;
  media_type: "game";
  title: string;
  poster_url: string | null;
  release_date: string | null;
  description: string | null;
  platforms: string | null;
  genres: string | null;
  rating: number | null;
  metacritic: number | null;
  playtime: number | null;
}

export interface MusicDetailedInfo {
  external_id: string;
  media_type: "song" | "album" | "playlist";
  title: string;
  artist: string | null;
  album: string | null;
  poster_url: string | null;
  release_date: string | null;
  genre: string | null;
  track_duration: number | null;
  track_count: number | null;
  preview_url: string | null;
}

export type CachedMediaDetails =
  | DetailedMediaInfo
  | BookDetailedInfo
  | GameDetailedInfo
  | MusicDetailedInfo;

type MediaDetailsCacheRow = {
  external_id: string;
  media_type: MediaType;
  data: CachedMediaDetails;
  fetched_at: string;
  expires_at: string | null;
};

function isCacheFresh(
  row: Pick<MediaDetailsCacheRow, "fetched_at" | "expires_at">,
): boolean {
  if (row.expires_at) {
    return Date.parse(row.expires_at) > Date.now();
  }
  return Date.parse(row.fetched_at) + DEFAULT_TTL_MS > Date.now();
}

function toCacheKey(externalId: string, mediaType: MediaType): string {
  return `${externalId}:${mediaType}`;
}

/**
 * Fetch cached details for a small set of items.
 * Uses a simple OR filter because watchlist pages are small (10 items).
 */
export async function getCachedMediaDetailsBatch(
  items: Array<{ external_id: string; media_type: MediaType }>,
): Promise<Map<string, CachedMediaDetails>> {
  const results = new Map<string, CachedMediaDetails>();
  if (items.length === 0) return results;

  try {
    // PostgREST OR syntax: and(external_id.eq.X,media_type.eq.movie),and(...)
    const orFilter = items
      .map(
        (item) =>
          `and(external_id.eq.${encodeURIComponent(item.external_id)},media_type.eq.${item.media_type})`,
      )
      .join(",");

    const { data, error } = await supabase
      .from("media_details_cache")
      .select("external_id, media_type, data, fetched_at, expires_at")
      .or(orFilter);

    if (error) throw error;

    (data as MediaDetailsCacheRow[] | null)?.forEach((row) => {
      if (!row?.data) return;
      if (!isCacheFresh(row)) return;
      results.set(toCacheKey(row.external_id, row.media_type), row.data);
    });

    return results;
  } catch (error) {
    logger.warn("Failed to read media details cache", { error });
    return results;
  }
}

export async function getCachedMediaDetails(
  externalId: string,
  mediaType: MediaType,
): Promise<CachedMediaDetails | null> {
  try {
    const { data, error } = await supabase
      .from("media_details_cache")
      .select("external_id, media_type, data, fetched_at, expires_at")
      .eq("external_id", externalId)
      .eq("media_type", mediaType)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as MediaDetailsCacheRow;
    if (!row.data) return null;
    if (!isCacheFresh(row)) return null;

    return row.data;
  } catch (error) {
    logger.warn("Failed to read media details cache row", {
      error,
      externalId,
      mediaType,
    });
    return null;
  }
}

export async function upsertCachedMediaDetails(
  details: Pick<CachedMediaDetails, "external_id" | "media_type">,
  options?: { ttlMs?: number },
): Promise<CachedMediaDetails | null> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  try {
    const { data, error } = await supabase.functions.invoke(
      "populate-media-cache",
      {
        body: {
          externalId: details.external_id,
          mediaType: details.media_type,
          ttlMs,
        },
      },
    );

    if (error) {
      const status = (error as { context?: { status?: number } })?.context
        ?.status;

      if (status === 403) {
        logger.warn("populate-media-cache denied (403)", {
          externalId: details.external_id,
          mediaType: details.media_type,
          status,
          message: error.message,
        });
        return null;
      }

      throw error;
    }

    if (data && typeof data === "object" && "error" in data) {
      throw new Error(
        String((data as { error?: string }).error || "Unknown error"),
      );
    }

    return ((data as { details?: CachedMediaDetails } | null)?.details ??
      null) as CachedMediaDetails | null;
  } catch (error) {
    logger.warn("Failed to upsert media details cache", {
      error,
      externalId: details.external_id,
      mediaType: details.media_type,
    });
    return null;
  }
}
