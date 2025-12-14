import { fetchDetailedMediaInfo, type DetailedMediaInfo } from "@/utils/tmdbDetails";
import { getCachedMediaDetails, upsertCachedMediaDetails } from "@/services/mediaDetailsCacheService";

/**
 * Cache-aware fetch for movie/TV details.
 * Order:
 * 1) Supabase shared cache (fast)
 * 2) External APIs (TMDB/OMDB), then write-through to Supabase cache
 */
export async function getMediaDetailsWithCache(
  externalId: string,
  mediaType: "movie" | "tv"
): Promise<DetailedMediaInfo | null> {
  const cached = await getCachedMediaDetails(externalId, mediaType);
  if (cached) return cached;

  const fetched = await fetchDetailedMediaInfo(externalId, mediaType);
  if (fetched) {
    void upsertCachedMediaDetails(fetched);
  }
  return fetched;
}
