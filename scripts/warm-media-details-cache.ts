#!/usr/bin/env node

/**
 * Cache warmer for shared media details.
 *
 * Purpose:
 * - Populates/refreshes the shared `media_details_cache` table for canonical media
 *   types referenced by both `user_watchlist` and `media_list_items`.
 * - Designed to be run manually when you want to refresh stale data.
 *
 * IMPORTANT (Supabase permissions):
 * - This script uses the Supabase *service role* key.
 * - Depending on your DB grants, the service role may NOT have direct table access
 *   to `public.user_watchlist` and/or `public.media_details_cache`.
 * - If you get permission errors, temporarily run these SQL grants in Supabase:
 *
 *     GRANT SELECT ON TABLE public.user_watchlist TO service_role;
 *     GRANT SELECT ON TABLE public.media_list_items TO service_role;
 *     GRANT SELECT, INSERT, UPDATE ON TABLE public.media_details_cache TO service_role;
 *
 * - After warming, revoke them to return to least-privilege:
 *
 *     REVOKE SELECT ON TABLE public.user_watchlist FROM service_role;
 *     REVOKE SELECT ON TABLE public.media_list_items FROM service_role;
 *     REVOKE SELECT, INSERT, UPDATE ON TABLE public.media_details_cache FROM service_role;
 *
 * Usage:
 *   # Default: all users
 *   npm run cache:warm:media-details
 *
 *   # Scope to a single user
 *   npm run cache:warm:media-details -- --user-id <UUID>
 *
 *   # Force refresh even if cache already has entries
 *   npm run cache:warm:media-details -- --force
 *
 *   # Force refresh for a single user
 *   npm run cache:warm:media-details -- --user-id <UUID> --force
 *
 * Requirements in .env.local:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - VITE_TMDB_API_KEY
 * - VITE_OMDB_API_KEY (optional but recommended)
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fetchDetailedMediaInfo } from "../src/utils/tmdbDetails";
import { fetchGameDetails } from "../src/utils/mediaSearchAdapters";

dotenv.config({ path: ".env.local" });

type MediaType =
  | "movie"
  | "tv"
  | "book"
  | "game"
  | "song"
  | "album"
  | "playlist";

type WatchlistRow = {
  external_id: string;
  media_type: MediaType;
};

type CollectionRow = {
  external_id: string;
  media_type: MediaType;
};

type CacheKeyRow = {
  external_id: string;
  media_type: MediaType;
};

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value =
      argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
    args.set(key, value);
  }
  return args;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Don't print secrets; just print the missing key name.
    console.error(`❌ Missing env var: ${name}`);
    process.exit(1);
  }
  return value;
}

const args = parseArgs(process.argv);
const userId =
  typeof args.get("user-id") === "string"
    ? String(args.get("user-id"))
    : undefined;
const allUsers = args.get("all") === true || !userId;
const forceRefresh = args.get("force") === true;

if (args.get("help") === true) {
  console.log("\nUsage:");
  console.log("  npm run cache:warm:media-details");
  console.log("  npm run cache:warm:media-details -- --user-id <UUID>");
  console.log("  npm run cache:warm:media-details -- --force");
  console.log(
    "  npm run cache:warm:media-details -- --user-id <UUID> --force\n",
  );
  process.exit(0);
}

const supabaseUrl = requireEnv("VITE_SUPABASE_URL");
const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

// Ensure TMDB key exists for the fetcher; it will log if OMDB missing.
requireEnv("VITE_TMDB_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function key(externalId: string, mediaType: MediaType) {
  return `${externalId}:${mediaType}`;
}

async function fetchUniqueWatchlistPairs(): Promise<
  Array<{ external_id: string; media_type: MediaType }>
> {
  const uniquePairsMap = new Map<
    string,
    { external_id: string; media_type: MediaType }
  >();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("user_watchlist")
      .select("external_id, media_type")
      .in("media_type", [
        "movie",
        "tv",
        "book",
        "game",
        "song",
        "album",
        "playlist",
      ])
      .range(from, from + pageSize - 1);

    if (!allUsers) {
      query = query.eq("user_id", userId!);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []) as WatchlistRow[];
    rows.forEach((row) => {
      uniquePairsMap.set(key(row.external_id, row.media_type), {
        external_id: row.external_id,
        media_type: row.media_type,
      });
    });

    if (rows.length < pageSize) break;
  }

  return Array.from(uniquePairsMap.values());
}

async function fetchUniqueCollectionPairs(): Promise<
  Array<{ external_id: string; media_type: MediaType }>
> {
  const uniquePairsMap = new Map<
    string,
    { external_id: string; media_type: MediaType }
  >();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("media_list_items")
      .select("external_id, media_type")
      .in("media_type", [
        "movie",
        "tv",
        "book",
        "game",
        "song",
        "album",
        "playlist",
      ])
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const rows = (data || []) as CollectionRow[];
    rows.forEach((row) => {
      uniquePairsMap.set(key(row.external_id, row.media_type), {
        external_id: row.external_id,
        media_type: row.media_type,
      });
    });

    if (rows.length < pageSize) break;
  }

  return Array.from(uniquePairsMap.values());
}

async function getExistingCacheKeys(
  pairs: Array<{ external_id: string; media_type: MediaType }>,
) {
  const existing = new Set<string>();
  if (pairs.length === 0) return existing;

  // Avoid building giant `.or(...)` filters that can exceed URL/query limits.
  // Instead, fetch existing keys by external_id batches.
  const uniqueExternalIds = Array.from(
    new Set(pairs.map((p) => p.external_id)),
  );
  const chunkSize = 500;

  for (let i = 0; i < uniqueExternalIds.length; i += chunkSize) {
    const chunk = uniqueExternalIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("media_details_cache")
      .select("external_id, media_type")
      .in("external_id", chunk)
      .in("media_type", [
        "movie",
        "tv",
        "book",
        "game",
        "song",
        "album",
        "playlist",
      ]);

    if (error) throw error;

    (data as CacheKeyRow[] | null)?.forEach((row) => {
      existing.add(key(row.external_id, row.media_type));
    });
  }

  return existing;
}

async function upsertCache(
  details: { external_id: string; media_type: MediaType } & Record<
    string,
    unknown
  >,
) {
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 180,
  ).toISOString();

  const { error } = await supabase.from("media_details_cache").upsert(
    {
      external_id: details.external_id,
      media_type: details.media_type,
      data: details,
      fetched_at: nowIso,
      expires_at: expiresAtIso,
      updated_at: nowIso,
    },
    { onConflict: "external_id,media_type" },
  );

  if (error) throw error;
}

async function fetchBookDetails(externalId: string) {
  const apiKey = process.env.VITE_GOOGLE_BOOKS_API_KEY || "";
  const params = new URLSearchParams({ key: apiKey });
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(externalId)}?${params}`,
  );
  if (!response.ok) return null;

  const data = await response.json();
  const info = data?.volumeInfo || {};
  const identifiers = Array.isArray(info?.industryIdentifiers)
    ? info.industryIdentifiers
    : [];
  const isbn13 = identifiers.find(
    (entry: { type?: string }) => entry.type === "ISBN_13",
  )?.identifier;
  const isbn10 = identifiers.find(
    (entry: { type?: string }) => entry.type === "ISBN_10",
  )?.identifier;

  return {
    external_id: String(data?.id || externalId),
    media_type: "book",
    title: info?.title || "Unknown Title",
    authors: Array.isArray(info?.authors) ? info.authors.join(", ") : null,
    poster_url:
      info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || null,
    release_date: info?.publishedDate || null,
    description: info?.description || null,
    page_count: info?.pageCount || null,
    categories: Array.isArray(info?.categories)
      ? info.categories.join(", ")
      : null,
    publisher: info?.publisher || null,
    isbn: isbn13 || isbn10 || null,
    average_rating: info?.averageRating || null,
  };
}

async function fetchGameDetailedInfo(externalId: string) {
  const details = await fetchGameDetails(externalId);
  if (!details) return null;

  return {
    external_id: String(details.id || externalId),
    media_type: "game",
    title: details.name || "Unknown Game",
    poster_url: details.background_image || null,
    release_date: details.released || null,
    description: details.description_raw || null,
    platforms:
      details.platforms?.map((p) => p.platform.name).join(", ") || null,
    genres: details.genres?.map((g) => g.name).join(", ") || null,
    rating: details.rating || null,
    metacritic: details.metacritic || null,
    playtime: details.playtime || null,
  };
}

async function fetchMusicDetails(
  externalId: string,
  mediaType: "song" | "album" | "playlist",
) {
  const entity =
    mediaType === "song"
      ? "song"
      : mediaType === "album"
        ? "album"
        : "playlist";
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(externalId)}&entity=${entity}`,
  );
  if (!response.ok) return null;

  const payload = await response.json();
  const result = Array.isArray(payload?.results) ? payload.results[0] : null;
  if (!result) return null;

  return {
    external_id: String(result.trackId || result.collectionId || externalId),
    media_type: mediaType,
    title:
      result.trackName ||
      result.collectionName ||
      result.artistName ||
      "Unknown Title",
    artist: result.artistName || null,
    album: result.collectionName || null,
    poster_url: result.artworkUrl100 || null,
    release_date: result.releaseDate || null,
    genre: result.primaryGenreName || null,
    track_duration: result.trackTimeMillis || null,
    track_count: result.trackCount || null,
    preview_url: result.previewUrl || null,
  };
}

async function fetchDetailsForItem(externalId: string, mediaType: MediaType) {
  if (mediaType === "movie" || mediaType === "tv") {
    return await fetchDetailedMediaInfo(externalId, mediaType, {
      includeOmdb: true,
    });
  }

  if (mediaType === "book") {
    return await fetchBookDetails(externalId);
  }

  if (mediaType === "game") {
    return await fetchGameDetailedInfo(externalId);
  }

  return await fetchMusicDetails(externalId, mediaType);
}

async function main() {
  console.log("\n🔧 Warming media_details_cache…\n");

  console.log(
    `Scope: ${allUsers ? "all users" : `user ${userId}`}. Mode: ${forceRefresh ? "force refresh" : "fill missing"}.\n`,
  );

  const [watchlistPairs, collectionPairs] = await Promise.all([
    fetchUniqueWatchlistPairs(),
    fetchUniqueCollectionPairs(),
  ]);

  const combinedMap = new Map<
    string,
    { external_id: string; media_type: MediaType }
  >();
  [...watchlistPairs, ...collectionPairs].forEach((pair) => {
    combinedMap.set(key(pair.external_id, pair.media_type), pair);
  });

  const uniquePairs = Array.from(combinedMap.values());

  console.log(
    `Found ${uniquePairs.length} unique items across watchlist (${watchlistPairs.length}) and collections (${collectionPairs.length}).`,
  );

  const existingKeys = await getExistingCacheKeys(uniquePairs);
  const toFetch = forceRefresh
    ? uniquePairs
    : uniquePairs.filter(
        (p) => !existingKeys.has(key(p.external_id, p.media_type)),
      );

  console.log(
    `Cache already has ${existingKeys.size}. Will fetch ${toFetch.length}${forceRefresh ? " (force)" : ""}.\n`,
  );

  let ok = 0;
  let fail = 0;

  // Sequential: gentle on APIs; internal limiters still apply.
  for (const item of toFetch) {
    try {
      const details = await fetchDetailsForItem(
        item.external_id,
        item.media_type,
      );

      if (!details) {
        fail += 1;
        console.log(`✗ ${item.media_type} ${item.external_id} (no details)`);
        continue;
      }

      await upsertCache(details);
      ok += 1;
      console.log(`✓ ${details.media_type} ${details.external_id} cached`);
    } catch (e: unknown) {
      fail += 1;
      const message = e instanceof Error ? e.message : "error";
      console.log(`✗ ${item.media_type} ${item.external_id} (${message})`);
    }
  }

  console.log(`\n✅ Done. Cached: ${ok}, Failed: ${fail}\n`);
}

main().catch((e) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error("\n❌ Cache warm failed:", message);
  process.exit(1);
});
