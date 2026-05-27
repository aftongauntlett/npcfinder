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
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

interface CacheEntry {
  data: UnifiedSearchResponse;
  expiresAt: number;
}

const scopedSearchCache = new Map<string, CacheEntry>();
const inFlightScopedSearches = new Map<
  string,
  Promise<UnifiedSearchResponse>
>();

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

export type UnifiedSearchScope =
  | "all"
  | "movies-tv"
  | "books"
  | "games"
  | "music";

interface ScopeDebugStats {
  requests: number;
  cacheHits: number;
  inFlightHits: number;
  networkRequests: number;
  providerCallsEstimated: number;
  emptyQuerySkips: number;
}

export interface UnifiedMediaSearchDebugStats {
  requests: number;
  cacheHits: number;
  inFlightHits: number;
  networkRequests: number;
  providerCallsEstimated: number;
  emptyQuerySkips: number;
  cacheSize: number;
  inFlightSize: number;
  byScope: Record<UnifiedSearchScope, ScopeDebugStats>;
}

const isDev = import.meta.env.DEV;

function createScopeDebugStats(): ScopeDebugStats {
  return {
    requests: 0,
    cacheHits: 0,
    inFlightHits: 0,
    networkRequests: 0,
    providerCallsEstimated: 0,
    emptyQuerySkips: 0,
  };
}

function createDebugStats(): UnifiedMediaSearchDebugStats {
  return {
    requests: 0,
    cacheHits: 0,
    inFlightHits: 0,
    networkRequests: 0,
    providerCallsEstimated: 0,
    emptyQuerySkips: 0,
    cacheSize: 0,
    inFlightSize: 0,
    byScope: {
      all: createScopeDebugStats(),
      "movies-tv": createScopeDebugStats(),
      books: createScopeDebugStats(),
      games: createScopeDebugStats(),
      music: createScopeDebugStats(),
    },
  };
}

let debugStats = createDebugStats();

function updateDebugSnapshot(): void {
  if (!isDev) {
    return;
  }
  debugStats.cacheSize = scopedSearchCache.size;
  debugStats.inFlightSize = inFlightScopedSearches.size;
}

function bumpRequest(scope: UnifiedSearchScope): void {
  if (!isDev) {
    return;
  }
  debugStats.requests += 1;
  debugStats.byScope[scope].requests += 1;
  updateDebugSnapshot();
}

function bumpCacheHit(scope: UnifiedSearchScope): void {
  if (!isDev) {
    return;
  }
  debugStats.cacheHits += 1;
  debugStats.byScope[scope].cacheHits += 1;
  updateDebugSnapshot();
}

function bumpInFlightHit(scope: UnifiedSearchScope): void {
  if (!isDev) {
    return;
  }
  debugStats.inFlightHits += 1;
  debugStats.byScope[scope].inFlightHits += 1;
  updateDebugSnapshot();
}

function bumpNetwork(
  scope: UnifiedSearchScope,
  providerCallsEstimated: number,
): void {
  if (!isDev) {
    return;
  }
  debugStats.networkRequests += 1;
  debugStats.providerCallsEstimated += providerCallsEstimated;
  debugStats.byScope[scope].networkRequests += 1;
  debugStats.byScope[scope].providerCallsEstimated += providerCallsEstimated;
  updateDebugSnapshot();
}

function bumpEmptyQuery(scope: UnifiedSearchScope): void {
  if (!isDev) {
    return;
  }
  debugStats.emptyQuerySkips += 1;
  debugStats.byScope[scope].emptyQuerySkips += 1;
  updateDebugSnapshot();
}

/**
 * Dev-only counters for validating cache and API behavior.
 * Returns null in production builds.
 */
export function getUnifiedMediaSearchDebugStats(): UnifiedMediaSearchDebugStats | null {
  if (!isDev) {
    return null;
  }

  updateDebugSnapshot();

  return {
    ...debugStats,
    byScope: {
      all: { ...debugStats.byScope.all },
      "movies-tv": { ...debugStats.byScope["movies-tv"] },
      books: { ...debugStats.byScope.books },
      games: { ...debugStats.byScope.games },
      music: { ...debugStats.byScope.music },
    },
  };
}

/**
 * Dev-only helper to clear debug counters between test sessions.
 */
export function resetUnifiedMediaSearchDebugStats(): void {
  if (!isDev) {
    return;
  }
  debugStats = createDebugStats();
  updateDebugSnapshot();
}

function finalizeResults(results: MediaItem[]): UnifiedSearchResponse {
  const filtered = results.filter((item) =>
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

function buildCacheKey(query: string, scope: UnifiedSearchScope): string {
  return `${scope}:${query.trim().toLowerCase()}`;
}

function getCachedSearch(key: string): UnifiedSearchResponse | null {
  const cached = scopedSearchCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    scopedSearchCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedSearch(key: string, data: UnifiedSearchResponse): void {
  scopedSearchCache.set(key, {
    data,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });

  if (scopedSearchCache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const oldestKey = scopedSearchCache.keys().next().value;
  if (oldestKey) {
    scopedSearchCache.delete(oldestKey);
  }
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

  return finalizeResults(merged);
}

export async function searchMediaByScope(
  query: string,
  scope: UnifiedSearchScope,
): Promise<UnifiedSearchResponse> {
  bumpRequest(scope);

  const q = query.trim();
  if (!q) {
    bumpEmptyQuery(scope);
    return { results: [], totalBeforeCap: 0, capped: false };
  }

  if (scope === "all") {
    const cacheKey = buildCacheKey(q, scope);
    const cached = getCachedSearch(cacheKey);
    if (cached) {
      bumpCacheHit(scope);
      return cached;
    }

    const inFlight = inFlightScopedSearches.get(cacheKey);
    if (inFlight) {
      bumpInFlightHit(scope);
      return inFlight;
    }

    bumpNetwork(scope, 4);

    const request = searchAllMedia(q)
      .then((response) => {
        setCachedSearch(cacheKey, response);
        updateDebugSnapshot();
        return response;
      })
      .finally(() => {
        inFlightScopedSearches.delete(cacheKey);
        updateDebugSnapshot();
      });

    inFlightScopedSearches.set(cacheKey, request);
    updateDebugSnapshot();
    return request;
  }

  const cacheKey = buildCacheKey(q, scope);
  const cached = getCachedSearch(cacheKey);
  if (cached) {
    bumpCacheHit(scope);
    return cached;
  }

  const inFlight = inFlightScopedSearches.get(cacheKey);
  if (inFlight) {
    bumpInFlightHit(scope);
    return inFlight;
  }

  bumpNetwork(scope, 1);

  const request = (async () => {
    try {
      if (scope === "movies-tv") {
        return finalizeResults(await searchMoviesAndTV(q));
      }

      if (scope === "books") {
        return finalizeResults(await searchBooks(q));
      }

      if (scope === "games") {
        return finalizeResults(await searchGames(q));
      }

      return finalizeResults(await searchMusic(q));
    } catch (error) {
      logger.warn("Scoped media search failed", { scope, error });
      return { results: [], totalBeforeCap: 0, capped: false };
    }
  })()
    .then((response) => {
      setCachedSearch(cacheKey, response);
      updateDebugSnapshot();
      return response;
    })
    .finally(() => {
      inFlightScopedSearches.delete(cacheKey);
      updateDebugSnapshot();
    });

  inFlightScopedSearches.set(cacheKey, request);
  updateDebugSnapshot();
  return request;
}
