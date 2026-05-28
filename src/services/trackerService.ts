import type { MediaItem } from "@/components/shared";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import {
  upsertMediaFromItem,
  type CatalogMedia,
  type ServiceResponse,
} from "@/services/mediaCatalogService";

export type TrackerStatus = "want_to" | "in_progress" | "done";

export interface TrackerChapterNote {
  id: string;
  chapter: string;
  note: string;
  created_at: string;
}

export interface TrackerItem {
  id: string;
  user_id: string;
  media_id: string;
  status: TrackerStatus;
  rating: number | null;
  note: string | null;
  api_media_source_snapshot: Record<string, unknown> | null;
  media_overrides: Record<string, unknown> | null;
  media_edited_fields: string[] | null;
  tv_current_season: number | null;
  tv_current_episode: number | null;
  book_current_page: number | null;
  book_chapter_notes: TrackerChapterNote[] | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  media: CatalogMedia | null;
}

function toObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function applyMediaOverrides(
  media: CatalogMedia | null,
  overrides: Record<string, unknown> | null,
): CatalogMedia | null {
  if (!media || !overrides) {
    return media;
  }

  return {
    ...media,
    ...(overrides as Partial<CatalogMedia>),
  };
}

function normalizeTrackerItem(row: TrackerItem): TrackerItem {
  const overrides = toObjectRecord(row.media_overrides);

  return {
    ...row,
    api_media_source_snapshot: toObjectRecord(row.api_media_source_snapshot),
    media_overrides: overrides,
    media_edited_fields: Array.isArray(row.media_edited_fields)
      ? row.media_edited_fields
      : [],
    media: applyMediaOverrides(row.media, overrides),
  };
}

export interface TrackerStats {
  activeCount: number;
  doneCount: number;
  doneByType: Record<string, number>;
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated");

  return user.id;
}

function normalizeUpdate(
  updates: Partial<
    Pick<
      TrackerItem,
      | "status"
      | "rating"
      | "note"
      | "api_media_source_snapshot"
      | "media_overrides"
      | "media_edited_fields"
      | "completed_at"
      | "tv_current_season"
      | "tv_current_episode"
      | "book_current_page"
      | "book_chapter_notes"
    >
  >,
) {
  const next: Record<string, unknown> = {
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    ...(updates.rating !== undefined ? { rating: updates.rating } : {}),
    ...(updates.note !== undefined ? { note: updates.note } : {}),
    ...(updates.api_media_source_snapshot !== undefined
      ? { api_media_source_snapshot: updates.api_media_source_snapshot }
      : {}),
    ...(updates.media_overrides !== undefined
      ? { media_overrides: updates.media_overrides }
      : {}),
    ...(updates.media_edited_fields !== undefined
      ? { media_edited_fields: updates.media_edited_fields }
      : {}),
    ...(updates.tv_current_season !== undefined
      ? { tv_current_season: updates.tv_current_season }
      : {}),
    ...(updates.tv_current_episode !== undefined
      ? { tv_current_episode: updates.tv_current_episode }
      : {}),
    ...(updates.book_current_page !== undefined
      ? { book_current_page: updates.book_current_page }
      : {}),
    ...(updates.book_chapter_notes !== undefined
      ? { book_chapter_notes: updates.book_chapter_notes }
      : {}),
    ...(updates.completed_at !== undefined
      ? { completed_at: updates.completed_at }
      : {}),
  };

  if (updates.status === "done" && updates.completed_at === undefined) {
    next.completed_at = new Date().toISOString();
  }

  if (updates.status && updates.status !== "done") {
    next.completed_at = null;
  }

  return next;
}

export async function getTrackerItems(
  filter: "active" | "done",
): Promise<ServiceResponse<TrackerItem[]>> {
  try {
    const userId = await getCurrentUserId();

    let query = supabase
      .from("tracker_items")
      .select("*, media:media_id(*)")
      .eq("user_id", userId);

    if (filter === "done") {
      query = query.eq("status", "done").order("completed_at", {
        ascending: false,
        nullsFirst: false,
      });
    } else {
      query = query
        .in("status", ["want_to", "in_progress"])
        .order("updated_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    const normalized = ((data || []) as TrackerItem[]).map(
      normalizeTrackerItem,
    );

    return { data: normalized, error: null };
  } catch (error) {
    logger.error("Failed to load tracker items", { error, filter });
    return { data: null, error: error as Error };
  }
}

export async function getTrackerStats(): Promise<
  ServiceResponse<TrackerStats>
> {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("tracker_items")
      .select("status, media:media_id(media_type)")
      .eq("user_id", userId);

    if (error) throw error;

    const rows = (data || []) as Array<{
      status: TrackerStatus;
      media: { media_type?: string } | null;
    }>;

    const stats: TrackerStats = {
      activeCount: 0,
      doneCount: 0,
      doneByType: {
        movie: 0,
        tv: 0,
        game: 0,
        book: 0,
        song: 0,
        album: 0,
        playlist: 0,
      },
    };

    for (const row of rows) {
      if (row.status === "done") {
        stats.doneCount += 1;
        const mediaType = row.media?.media_type || "movie";
        stats.doneByType[mediaType] = (stats.doneByType[mediaType] || 0) + 1;
      } else {
        stats.activeCount += 1;
      }
    }

    return { data: stats, error: null };
  } catch (error) {
    logger.error("Failed to load tracker stats", { error });
    return { data: null, error: error as Error };
  }
}

export async function addTrackerItem(params: {
  item: MediaItem;
  status?: TrackerStatus;
}): Promise<ServiceResponse<TrackerItem>> {
  try {
    const userId = await getCurrentUserId();

    const mediaResult = await upsertMediaFromItem(params.item);
    if (mediaResult.error || !mediaResult.data) {
      throw mediaResult.error || new Error("Media catalog upsert failed");
    }

    const status = params.status || "want_to";

    const { data, error } = await supabase
      .from("tracker_items")
      .upsert(
        {
          user_id: userId,
          media_id: mediaResult.data.id,
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,media_id" },
      )
      .select("*, media:media_id(*)")
      .single();

    if (error) throw error;

    return { data: normalizeTrackerItem(data as TrackerItem), error: null };
  } catch (error) {
    logger.error("Failed to add tracker item", { error });
    return { data: null, error: error as Error };
  }
}

export async function updateTrackerItem(
  trackerItemId: string,
  updates: Partial<
    Pick<
      TrackerItem,
      | "status"
      | "rating"
      | "note"
      | "api_media_source_snapshot"
      | "media_overrides"
      | "media_edited_fields"
      | "completed_at"
      | "tv_current_season"
      | "tv_current_episode"
      | "book_current_page"
      | "book_chapter_notes"
    >
  >,
): Promise<ServiceResponse<TrackerItem>> {
  try {
    const next = normalizeUpdate(updates);

    const { data, error } = await supabase
      .from("tracker_items")
      .update(next)
      .eq("id", trackerItemId)
      .select("*, media:media_id(*)")
      .single();

    if (error) throw error;

    return { data: normalizeTrackerItem(data as TrackerItem), error: null };
  } catch (error) {
    logger.error("Failed to update tracker item", { error, trackerItemId });
    return { data: null, error: error as Error };
  }
}

export async function removeTrackerItem(
  trackerItemId: string,
): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from("tracker_items")
      .delete()
      .eq("id", trackerItemId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    logger.error("Failed to remove tracker item", { error, trackerItemId });
    return { data: null, error: error as Error };
  }
}
