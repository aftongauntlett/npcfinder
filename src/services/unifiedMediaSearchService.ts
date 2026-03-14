import type { MediaItem } from "@/components/shared";
import { logger } from "@/lib/logger";
import {
  searchGames,
  searchMoviesAndTV,
  searchMusic,
} from "@/utils/mediaSearchAdapters";
import { searchBooks } from "@/utils/bookSearchAdapters";

/**
 * Unified media search across all providers.
 *
 * Phase 1 behavior:
 * - Fire provider searches concurrently
 * - Best-effort: failures from one provider do not fail the whole search
 * - Returns mixed results labeled by `media_type`
 */
export async function searchAllMedia(query: string): Promise<MediaItem[]> {
  const q = query.trim();
  if (!q) return [];

  const results = await Promise.allSettled([
    searchMoviesAndTV(q),
    searchBooks(q),
    searchGames(q),
    searchMusic(q),
  ]);

  const merged: MediaItem[] = [];

  for (const res of results) {
    if (res.status === "fulfilled") {
      merged.push(...res.value);
    } else {
      logger.warn("Unified search provider failed", { error: res.reason });
    }
  }

  // Soft cap to keep UI snappy.
  return merged.slice(0, 60);
}
