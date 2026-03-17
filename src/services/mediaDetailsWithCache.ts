import { type DetailedMediaInfo } from "@/utils/tmdbDetails";
import {
  getCachedMediaDetails,
  upsertCachedMediaDetails,
  type BookDetailedInfo,
  type GameDetailedInfo,
  type MediaType,
} from "@/services/mediaDetailsCacheService";

/**
 * Cache-aware fetch for movie/TV details.
 * Order:
 * 1) Supabase shared cache (fast)
 * 2) Edge Function fetch+cache write-through (server-side provider calls)
 */
export async function getMediaDetailsWithCache(
  externalId: string,
  mediaType: "movie" | "tv",
): Promise<DetailedMediaInfo | null> {
  const cached = await getCachedMediaDetails(externalId, mediaType);
  if (cached) return cached as DetailedMediaInfo;

  const fetched = await upsertCachedMediaDetails({
    external_id: externalId,
    media_type: mediaType,
  });
  return fetched as DetailedMediaInfo | null;
}

export async function getBookDetailsWithCache(
  externalId: string,
): Promise<BookDetailedInfo | null> {
  const mediaType: MediaType = "book";
  const cached = await getCachedMediaDetails(externalId, mediaType);
  if (cached) return cached as BookDetailedInfo;

  const fetched = await upsertCachedMediaDetails({
    external_id: externalId,
    media_type: mediaType,
  });
  return fetched as BookDetailedInfo | null;
}

export async function getGameDetailsWithCache(
  externalId: string,
): Promise<GameDetailedInfo | null> {
  const mediaType: MediaType = "game";
  const cached = await getCachedMediaDetails(externalId, mediaType);
  if (cached) return cached as GameDetailedInfo;

  const fetched = await upsertCachedMediaDetails({
    external_id: externalId,
    media_type: mediaType,
  });
  return fetched as GameDetailedInfo | null;
}
