import { supabase } from "@/lib/supabase";
import type { MediaItem } from "@/components/shared";
import { upsertMediaFromItem } from "@/services/mediaCatalogService";
import type { TrackerStatus } from "@/services/trackerService";
import { logger } from "@/lib/logger";

export interface ImportedItem {
  mediaItem: MediaItem;
  status: TrackerStatus;
  rating: number | null;
  completedAt: string | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export type ImportSource =
  | "goodreads"
  | "letterboxd"
  | "imdb"
  | "spotify"
  | "steam";

// --- CSV helpers ---

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function cleanISBN(raw: string): string | undefined {
  // Goodreads exports ISBNs as =""9780743273565"" (Excel artifact)
  const cleaned = raw.replace(/[="]/g, "").trim();
  return cleaned.length >= 10 ? cleaned : undefined;
}

function toISODate(date: string): string | null {
  if (!date) return null;
  // Goodreads uses YYYY/MM/DD — normalize slashes before parsing
  const normalized = date.replace(/\//g, "-");
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function goodreadsShelfToStatus(shelf: string): TrackerStatus {
  if (shelf === "read") return "done";
  if (shelf === "currently-reading") return "in_progress";
  return "want_to";
}

function goodreadsRatingToOurs(raw: string): number | null {
  const val = parseInt(raw, 10);
  if (isNaN(val) || val === 0) return null;
  return val * 2; // 1–5 → 2–10
}

function letterboxdRatingToOurs(raw: string): number | null {
  const val = parseFloat(raw);
  if (!raw || isNaN(val) || val === 0) return null;
  return Math.round(val * 2); // 0.5–5 half-stars → 1–10
}

function imdbTitleTypeToMediaType(type: string): "movie" | "tv" {
  const tvTypes = ["tvSeries", "tvMiniSeries", "tvSpecial", "tvShort"];
  return tvTypes.includes(type) ? "tv" : "movie";
}

// --- Parsers ---

export function parseGoodreadsCSV(text: string): ImportedItem[] {
  const rows = parseCSV(text);
  const items: ImportedItem[] = [];

  for (const row of rows) {
    const bookId = row["Book Id"];
    const title = row["Title"];
    if (!bookId || !title) continue;

    const shelf = row["Exclusive Shelf"] || "to-read";
    const status = goodreadsShelfToStatus(shelf);
    const rating = goodreadsRatingToOurs(row["My Rating"] ?? "0");
    const dateRead = row["Date Read"] ?? "";
    const completedAt = status === "done" ? toISODate(dateRead) : null;
    const pageCount = parseInt(row["Number of Pages"] ?? "0", 10);
    const year =
      parseInt(row["Original Publication Year"] ?? "0", 10) ||
      parseInt(row["Year Published"] ?? "0", 10);
    const isbn = cleanISBN(row["ISBN13"] ?? "");

    items.push({
      mediaItem: {
        external_id: `goodreads_${bookId}`,
        title,
        authors: row["Author"] || undefined,
        media_type: "book",
        poster_url: null,
        release_date: year ? `${year}-01-01` : null,
        page_count: pageCount > 0 ? pageCount : undefined,
        isbn: isbn || undefined,
      },
      status,
      rating,
      completedAt,
    });
  }

  return items;
}

export function parseLetterboxdCSV(text: string): ImportedItem[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const sample = rows[0];
  const hasWatchedDate = "Watched Date" in sample;
  const hasRating = "Rating" in sample;
  const isWatchlist = !hasWatchedDate && !hasRating;

  return rows.flatMap((row) => {
    const name = row["Name"];
    const uri = row["Letterboxd URI"] ?? "";
    if (!name) return [];

    const slug =
      uri.replace("https://letterboxd.com/film/", "").replace(/\/$/, "") ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const year = parseInt(row["Year"] ?? "0", 10);
    const rating = hasRating ? letterboxdRatingToOurs(row["Rating"] ?? "") : null;
    const watchedDate = hasWatchedDate ? (row["Watched Date"] ?? "") : null;
    const completedAt = watchedDate ? toISODate(watchedDate) : null;
    const status: TrackerStatus = isWatchlist ? "want_to" : "done";

    return [
      {
        mediaItem: {
          external_id: `letterboxd_${slug}`,
          title: name,
          media_type: "movie" as const,
          poster_url: null,
          release_date: year ? `${year}-01-01` : null,
        },
        status,
        rating,
        completedAt,
      },
    ];
  });
}

export function parseIMDbCSV(text: string): ImportedItem[] {
  const rows = parseCSV(text);
  const items: ImportedItem[] = [];

  for (const row of rows) {
    const tconst = row["Const"];
    const title = row["Title"];
    if (!tconst || !title || !tconst.startsWith("tt")) continue;

    const mediaType = imdbTitleTypeToMediaType(row["Title Type"] ?? "movie");
    const ratingRaw = parseInt(row["Your Rating"] ?? "0", 10);
    const rating = ratingRaw > 0 ? ratingRaw : null;
    const year = parseInt(row["Year"] ?? "0", 10);
    const dateRated = row["Date Rated"] ?? "";

    items.push({
      mediaItem: {
        external_id: `imdb_${tconst}`,
        title,
        media_type: mediaType,
        poster_url: null,
        release_date: year ? `${year}-01-01` : null,
        genres: row["Genres"] || undefined,
      },
      status: "done",
      rating,
      completedAt: dateRated ? toISODate(dateRated) : null,
    });
  }

  return items;
}

export function parseSpotifyLibraryJSON(text: string): ImportedItem[] {
  const items: ImportedItem[] = [];

  let data: {
    tracks?: Array<{ artist: string; album: string; track: string; uri: string }>;
    albums?: Array<{ artist: string; album: string; uri: string }>;
  };

  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return [];
  }

  for (const track of data.tracks ?? []) {
    const id = track.uri?.split(":").pop();
    if (!id || !track.track) continue;
    items.push({
      mediaItem: {
        external_id: `spotify_track_${id}`,
        title: track.track,
        artist: track.artist || undefined,
        album: track.album || undefined,
        media_type: "song",
        poster_url: null,
      },
      status: "want_to",
      rating: null,
      completedAt: null,
    });
  }

  for (const album of data.albums ?? []) {
    const id = album.uri?.split(":").pop();
    if (!id || !album.album) continue;
    items.push({
      mediaItem: {
        external_id: `spotify_album_${id}`,
        title: album.album,
        artist: album.artist || undefined,
        media_type: "album",
        poster_url: null,
      },
      status: "want_to",
      rating: null,
      completedAt: null,
    });
  }

  return items;
}

export function parseSteamExportCSV(text: string): ImportedItem[] {
  const rows = parseCSV(text);
  const items: ImportedItem[] = [];

  for (const row of rows) {
    const appId = row["AppID"];
    const gameTitle = row["Game title"] ?? row["Name"];
    if (!appId || !gameTitle) continue;

    const hoursPlayed = parseFloat(row["Hours played on record"] ?? "0");
    const status: TrackerStatus = hoursPlayed > 0.5 ? "done" : "want_to";

    items.push({
      mediaItem: {
        external_id: `steam_game_${appId}`,
        title: gameTitle,
        media_type: "game",
        poster_url: null,
      },
      status,
      rating: null,
      completedAt: null,
    });
  }

  return items;
}

export function parseImportFile(
  source: ImportSource,
  text: string,
): ImportedItem[] {
  switch (source) {
    case "goodreads":
      return parseGoodreadsCSV(text);
    case "letterboxd":
      return parseLetterboxdCSV(text);
    case "imdb":
      return parseIMDbCSV(text);
    case "spotify":
      return parseSpotifyLibraryJSON(text);
    case "steam":
      return parseSteamExportCSV(text);
  }
}

// --- Batch importer ---

const BATCH_CONCURRENCY = 5;

export async function importItems(
  items: ImportedItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...result, failed: items.length, errors: ["Not authenticated"] };
  }

  const userId = user.id;

  for (let i = 0; i < items.length; i += BATCH_CONCURRENCY) {
    const batch = items.slice(i, i + BATCH_CONCURRENCY);

    const outcomes = await Promise.allSettled(
      batch.map(async (item) => {
        const mediaResult = await upsertMediaFromItem(item.mediaItem);
        if (!mediaResult.data) {
          throw mediaResult.error ?? new Error("Media catalog upsert failed");
        }

        const { error } = await supabase
          .from("tracker_items")
          .upsert(
            {
              user_id: userId,
              media_id: mediaResult.data.id,
              status: item.status,
              rating: item.rating ?? null,
              completed_at:
                item.completedAt ??
                (item.status === "done" ? new Date().toISOString() : null),
            },
            { onConflict: "user_id,media_id", ignoreDuplicates: true },
          );

        if (error) throw error;
      }),
    );

    for (let j = 0; j < outcomes.length; j++) {
      const outcome = outcomes[j];
      if (outcome.status === "fulfilled") {
        result.imported++;
      } else {
        result.failed++;
        const title = batch[j]?.mediaItem.title ?? "Unknown";
        const msg =
          outcome.reason instanceof Error
            ? outcome.reason.message
            : String(outcome.reason);
        result.errors.push(`${title}: ${msg}`);
        logger.error("Import item failed", { error: outcome.reason, title });
      }
    }

    onProgress?.(Math.min(i + BATCH_CONCURRENCY, items.length), items.length);
  }

  return result;
}
