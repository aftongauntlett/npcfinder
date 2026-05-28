import type { MediaItem } from "@/components/shared";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";

export type CatalogMediaType =
  | "movie"
  | "tv"
  | "book"
  | "game"
  | "song"
  | "album"
  | "playlist";

export interface CatalogMedia {
  id: string;
  external_id: string;
  media_type: CatalogMediaType;
  is_user_created: boolean;
  created_by_user_id: string | null;
  title: string;
  subtitle: string | null;
  poster_url: string | null;
  release_date: string | null;
  description: string | null;
  year: number | null;
  genres: string | null;
  authors: string | null;
  artist: string | null;
  album: string | null;
  track_duration: number | null;
  track_count: number | null;
  preview_url: string | null;
  platforms: string | null;
  metacritic: number | null;
  playtime: number | null;
  isbn: string | null;
  page_count: number | null;
  publisher: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export function normalizeCatalogMediaType(rawType?: string): CatalogMediaType {
  const raw = (rawType || "").toLowerCase();

  if (
    raw === "movie" ||
    raw === "tv" ||
    raw === "book" ||
    raw === "game" ||
    raw === "song" ||
    raw === "album" ||
    raw === "playlist"
  ) {
    return raw;
  }

  if (raw === "track") return "song";
  if (raw === "collection") return "album";

  return "movie";
}

function normalizeYear(releaseDate?: string | null): number | null {
  if (!releaseDate) return null;
  const value = Number(releaseDate.split("-")[0]);
  return Number.isFinite(value) ? value : null;
}

async function getCurrentUserIdOrNull(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function upsertMediaFromItem(
  item: MediaItem,
): Promise<ServiceResponse<CatalogMedia>> {
  try {
    const mediaType = normalizeCatalogMediaType(item.media_type);
    const isUserCreated =
      item.is_user_created === true ||
      String(item.external_id).startsWith("custom:");
    const createdByUserId = isUserCreated
      ? await getCurrentUserIdOrNull()
      : null;

    const insert = {
      external_id: item.external_id,
      media_type: mediaType,
      ...(isUserCreated
        ? {
            is_user_created: true,
            created_by_user_id: createdByUserId,
          }
        : {}),
      title: item.title,
      subtitle:
        item.subtitle ?? item.artist ?? item.authors ?? item.platforms ?? null,
      poster_url: item.poster_url,
      release_date: item.release_date ?? null,
      description: item.description ?? item.description_raw ?? null,
      year: normalizeYear(item.release_date),
      genres: item.genres ?? item.genre ?? item.categories ?? null,
      authors: item.authors ?? null,
      artist: item.artist ?? null,
      album: item.album ?? null,
      track_duration: item.track_duration ?? null,
      track_count: item.track_count ?? null,
      preview_url: item.preview_url ?? null,
      platforms: item.platforms ?? null,
      metacritic: item.metacritic ?? null,
      playtime: item.playtime ?? null,
      isbn: item.isbn ?? null,
      page_count: item.page_count ?? null,
      publisher: null,
    };

    const { data, error } = await supabase
      .from("media")
      .upsert(insert, { onConflict: "external_id,media_type" })
      .select("*")
      .single();

    if (error) throw error;

    return { data: data as CatalogMedia, error: null };
  } catch (error) {
    logger.error("Failed to upsert media catalog entry", {
      error,
      externalId: item.external_id,
      mediaType: item.media_type,
    });

    return { data: null, error: error as Error };
  }
}
