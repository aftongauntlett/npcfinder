import type { MediaItem } from "@/components/shared";
import { logger } from "@/lib/logger";
import {
  searchGames,
  searchMoviesAndTV,
  searchMusic,
} from "@/utils/mediaSearchAdapters";
import { searchBooks } from "@/utils/bookSearchAdapters";

const CANONICAL_MEDIA_TYPES = [
  "movie",
  "tv",
  "book",
  "game",
  "song",
  "album",
  "playlist",
] as const;

export const UNIFIED_SEARCH_CAP = 60;

type CanonicalMediaType = (typeof CANONICAL_MEDIA_TYPES)[number];

function isCanonicalMediaType(value: unknown): value is CanonicalMediaType {
  return (
    typeof value === "string" &&
    CANONICAL_MEDIA_TYPES.includes(value as CanonicalMediaType)
  );
}

export interface UnifiedSearchResponse {
  results: MediaItem[];
  totalBeforeCap: number;
  capped: boolean;
}

/**
 * Unified media search across all providers.
 *
 * Phase 1 behavior:
 * - Fire provider searches concurrently
 * - Best-effort: failures from one provider do not fail the whole search
 * - Returns mixed results labeled by `media_type`
 */
export async function searchAllMedia(
  query: string,
): Promise<UnifiedSearchResponse> {
  const q = query.trim();
  if (!q) {
    return { results: [], totalBeforeCap: 0, capped: false };
  }

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

  const filtered = merged.filter((item) =>
    isCanonicalMediaType(item.media_type),
  );
  filtered.sort((a, b) => a.title.localeCompare(b.title));

  const capped = filtered.length > UNIFIED_SEARCH_CAP;

  return {
    results: filtered.slice(0, UNIFIED_SEARCH_CAP),
    totalBeforeCap: filtered.length,
    capped,
  };
}
