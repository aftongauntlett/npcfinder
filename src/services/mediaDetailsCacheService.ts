import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { DetailedMediaInfo } from "@/utils/tmdbDetails";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 180; // 180 days (mostly static)

type MediaType = "movie" | "tv";

type MediaDetailsCacheRow = {
  external_id: string;
  media_type: MediaType;
  data: DetailedMediaInfo;
  fetched_at: string;
  expires_at: string | null;
};

function isCacheFresh(row: Pick<MediaDetailsCacheRow, "fetched_at" | "expires_at">): boolean {
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
  items: Array<{ external_id: string; media_type: MediaType }>
): Promise<Map<string, DetailedMediaInfo>> {
  const results = new Map<string, DetailedMediaInfo>();
  if (items.length === 0) return results;

  try {
    // PostgREST OR syntax: and(external_id.eq.X,media_type.eq.movie),and(...)
    const orFilter = items
      .map(
        (item) =>
          `and(external_id.eq.${encodeURIComponent(item.external_id)},media_type.eq.${item.media_type})`
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
  mediaType: MediaType
): Promise<DetailedMediaInfo | null> {
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
    logger.warn("Failed to read media details cache row", { error, externalId, mediaType });
    return null;
  }
}

export async function upsertCachedMediaDetails(
  details: DetailedMediaInfo,
  options?: { ttlMs?: number }
): Promise<void> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  try {
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + ttlMs).toISOString();

    const { error } = await supabase.from("media_details_cache").upsert(
      {
        external_id: details.external_id,
        media_type: details.media_type,
        data: details,
        fetched_at: nowIso,
        expires_at: expiresAtIso,
        updated_at: nowIso,
      },
      { onConflict: "external_id,media_type" }
    );

    if (error) throw error;
  } catch (error) {
    logger.warn("Failed to upsert media details cache", {
      error,
      externalId: details.external_id,
      mediaType: details.media_type,
    });
  }
}
