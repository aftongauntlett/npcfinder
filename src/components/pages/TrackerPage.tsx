import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Film,
  Loader2,
  MessageSquare,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import AppLayout from "@/components/layouts/AppLayout";
import AddMediaFromCatalogModal from "@/components/media/AddMediaFromCatalogModal";
import {
  Button,
  ConfirmationModal,
  EmptyState,
  MediaPageToolbar,
  MediaPoster,
  Modal,
  StarRating,
  ThemedDatePicker,
  Textarea,
  ViewModeToggle,
} from "@/components/shared";
import Toast from "@/components/ui/Toast";
import {
  TRACKER_SCOPES,
  mediaTypeAllowedInScope,
  resolveTrackerScope,
  type TrackerMediaType,
  type TrackerScopeId,
} from "@/data/trackerScopes";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  useAddTrackerItem,
  useRemoveTrackerItem,
  useTrackerItems,
  useUpdateTrackerItem,
} from "@/hooks/useTrackerQueries";
import {
  getBookDetailsWithCache,
  getGameDetailsWithCache,
  getMediaDetailsWithCache,
} from "@/services/mediaDetailsWithCache";
import type {
  BookDetailedInfo,
  GameDetailedInfo,
} from "@/services/mediaDetailsCacheService";
import {
  fetchTvSeasonEpisodes,
  type DetailedMediaInfo,
  type TvSeasonEpisodeInfo,
} from "@/utils/tmdbDetails";
import type {
  TrackerChapterNote,
  TrackerItem,
  TrackerStatus,
} from "@/services/trackerService";

const PAGE_META_BASE = {
  noIndex: true,
};

type CardLayout = "list" | "grid";
type MediaFilter = "all" | TrackerMediaType;
type SortMode = "recent" | "title" | "year" | "added" | "completed" | "rating";

function hasInProgressTab(scope: TrackerScopeId): boolean {
  return scope === "books" || scope === "games" || scope === "tv";
}

function hasSingleFavoritesTab(scope: TrackerScopeId): boolean {
  return scope === "music";
}

function defaultViewMode(scope: TrackerScopeId): ViewMode {
  if (hasSingleFavoritesTab(scope)) return "favorites";
  return "todo";
}

function mediaLabel(mediaType: string | undefined): string {
  if (!mediaType) return "Unknown";
  if (mediaType === "tv") return "TV";
  if (mediaType === "song") return "Song";
  if (mediaType === "album") return "Album";
  if (mediaType === "game") return "Game";
  if (mediaType === "book") return "Book";
  if (mediaType === "movie") return "Movie";
  if (mediaType === "playlist") return "Playlist";
  return mediaType;
}

type ViewMode = "todo" | "in_progress" | "complete" | "favorites";

function moveForwardLabel(
  status: TrackerStatus,
  hasIntermediateStatus: boolean,
): string {
  if (status === "want_to") {
    return hasIntermediateStatus ? "Move to In Progress" : "Mark Complete";
  }
  if (status === "in_progress") return "Mark Complete";
  return "Complete";
}

function moveBackwardLabel(
  status: TrackerStatus,
  hasIntermediateStatus: boolean,
): string {
  if (status === "done") {
    return hasIntermediateStatus ? "Move to In Progress" : "Move to To-Do";
  }
  if (status === "in_progress") return "Move to To-Do";
  return "Move Back";
}

function forwardButtonClassName(
  status: TrackerStatus,
  size: "sm" | "md" = "md",
): string {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  if (status === "in_progress") {
    return `${sizeClass} rounded-full border-0 shadow-sm !bg-emerald-200 !text-emerald-800 hover:!bg-emerald-300 dark:!bg-emerald-500/30 dark:!text-emerald-100 dark:hover:!bg-emerald-500/40`;
  }

  return `${sizeClass} rounded-full border-0 shadow-sm !bg-sky-200 !text-sky-800 hover:!bg-sky-300 dark:!bg-sky-500/30 dark:!text-sky-100 dark:hover:!bg-sky-500/40`;
}

function backwardButtonClassName(size: "sm" | "md" = "md"): string {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return `${sizeClass} rounded-full border-0 shadow-sm !bg-slate-100 !text-slate-700 hover:!bg-slate-200 dark:!bg-slate-700/70 dark:!text-slate-200 dark:hover:!bg-slate-600/80`;
}

function deleteButtonClassName(size: "sm" | "md" = "md"): string {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return `${sizeClass} rounded-full border-0 shadow-sm bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/25 dark:text-rose-100 dark:hover:bg-rose-500/35`;
}

function shouldHideSubtitle(
  mediaType: string | undefined,
  subtitle: string | null | undefined,
): boolean {
  if (!subtitle) return true;

  const normalized = subtitle.trim().toLowerCase();

  if (mediaType === "movie") {
    return normalized === "movie" || normalized === "film";
  }

  if (mediaType === "tv") {
    return (
      normalized === "tv" ||
      normalized === "tv show" ||
      normalized === "show" ||
      normalized === "series" ||
      normalized === "television"
    );
  }

  return false;
}

function formatTrackDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPlaytime(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "-";
  }

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }

  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hrs`;
}

function formatReleaseDate(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toCompletedAtIso(dateValue: string): string | null {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toPositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.floor(parsed);
}

function normalizeChapterNotes(
  notes: TrackerChapterNote[] | null | undefined,
): TrackerChapterNote[] {
  if (!Array.isArray(notes)) {
    return [];
  }

  return notes
    .filter((note) => {
      if (!note || typeof note !== "object") return false;
      if (typeof note.id !== "string") return false;
      if (typeof note.chapter !== "string") return false;
      if (typeof note.note !== "string") return false;
      if (typeof note.created_at !== "string") return false;
      return note.chapter.trim().length > 0 && note.note.trim().length > 0;
    })
    .map((note) => ({
      id: note.id,
      chapter: note.chapter.trim(),
      note: note.note.trim(),
      created_at: note.created_at,
    }));
}

type EditableMediaFieldKey =
  | "title"
  | "subtitle"
  | "poster_url"
  | "release_date"
  | "description"
  | "genres"
  | "authors"
  | "artist"
  | "album"
  | "track_duration"
  | "track_count"
  | "preview_url"
  | "platforms"
  | "metacritic"
  | "playtime"
  | "isbn"
  | "page_count"
  | "publisher";

type EditableMediaDraft = Record<EditableMediaFieldKey, string>;

type EditableMediaFieldDefinition = {
  key: EditableMediaFieldKey;
  label: string;
  kind: "text" | "number" | "textarea" | "date";
  mediaTypes?: TrackerMediaType[];
};

const EDITABLE_MEDIA_FIELDS: EditableMediaFieldDefinition[] = [
  { key: "title", label: "Title", kind: "text" },
  { key: "subtitle", label: "Subtitle", kind: "text" },
  { key: "release_date", label: "Year", kind: "date" },
  { key: "genres", label: "Genres", kind: "text" },
  { key: "poster_url", label: "Poster URL", kind: "text" },
  { key: "authors", label: "Authors", kind: "text", mediaTypes: ["book"] },
  {
    key: "publisher",
    label: "Publisher",
    kind: "text",
    mediaTypes: ["book"],
  },
  { key: "isbn", label: "ISBN", kind: "text", mediaTypes: ["book"] },
  {
    key: "page_count",
    label: "Page Count",
    kind: "number",
    mediaTypes: ["book"],
  },
  {
    key: "platforms",
    label: "Platforms",
    kind: "text",
    mediaTypes: ["game"],
  },
  {
    key: "metacritic",
    label: "Metacritic",
    kind: "number",
    mediaTypes: ["game"],
  },
  {
    key: "playtime",
    label: "Playtime",
    kind: "number",
    mediaTypes: ["game"],
  },
  {
    key: "artist",
    label: "Artist",
    kind: "text",
    mediaTypes: ["song", "album"],
  },
  {
    key: "album",
    label: "Album",
    kind: "text",
    mediaTypes: ["song"],
  },
  {
    key: "track_duration",
    label: "Track Length",
    kind: "number",
    mediaTypes: ["song"],
  },
  {
    key: "track_count",
    label: "Track Count",
    kind: "number",
    mediaTypes: ["album"],
  },
  {
    key: "preview_url",
    label: "Preview URL",
    kind: "text",
    mediaTypes: ["song", "album"],
  },
  { key: "description", label: "Description", kind: "textarea" },
];

const EDITABLE_MEDIA_FIELD_LABELS = new Map(
  EDITABLE_MEDIA_FIELDS.map((field) => [field.key, field.label]),
);

function emptyEditableMediaDraft(): EditableMediaDraft {
  return EDITABLE_MEDIA_FIELDS.reduce((draft, field) => {
    draft[field.key] = "";
    return draft;
  }, {} as EditableMediaDraft);
}

function toEditableDraftValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getEditableMediaFields(
  mediaType: TrackerMediaType | undefined,
): EditableMediaFieldDefinition[] {
  return EDITABLE_MEDIA_FIELDS.filter(
    (field) =>
      !field.mediaTypes ||
      (mediaType ? field.mediaTypes.includes(mediaType) : false),
  );
}

function toReleaseDateDraftValue(releaseDate: unknown, year: unknown): string {
  const normalizedReleaseDate =
    typeof releaseDate === "string" ? toDateInputValue(releaseDate) : "";
  if (normalizedReleaseDate) {
    return normalizedReleaseDate;
  }

  const normalizedYear =
    typeof year === "string" || typeof year === "number"
      ? toPositiveInt(String(year))
      : null;
  if (!normalizedYear) {
    return "";
  }

  return `${String(normalizedYear).padStart(4, "0")}-01-01`;
}

function buildEditableMediaDraft(
  media: TrackerItem["media"] | null,
): EditableMediaDraft {
  const next = emptyEditableMediaDraft();
  if (!media) {
    return next;
  }

  for (const field of EDITABLE_MEDIA_FIELDS) {
    if (field.key === "release_date" && field.kind === "date") {
      next[field.key] = toReleaseDateDraftValue(media.release_date, media.year);
      continue;
    }

    next[field.key] = toEditableDraftValue(media[field.key]);
  }

  return next;
}

function buildMediaOverridesFromDraft(
  draft: EditableMediaDraft,
  fields: EditableMediaFieldDefinition[] = EDITABLE_MEDIA_FIELDS,
): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};

  for (const field of fields) {
    const rawValue = draft[field.key].trim();

    if (field.kind === "date") {
      if (!rawValue) {
        overrides[field.key] = null;
        if (field.key === "release_date") {
          overrides.year = null;
        }
        continue;
      }

      overrides[field.key] = rawValue;

      if (field.key === "release_date") {
        const parsedDate = new Date(`${rawValue}T00:00:00`);
        overrides.year = Number.isNaN(parsedDate.getTime())
          ? null
          : parsedDate.getFullYear();
      }

      continue;
    }

    if (field.kind === "number") {
      if (!rawValue) {
        overrides[field.key] = null;
        continue;
      }

      const parsed = Number(rawValue);
      overrides[field.key] = Number.isFinite(parsed)
        ? Math.round(parsed)
        : null;
      continue;
    }

    overrides[field.key] = rawValue.length > 0 ? rawValue : null;
  }

  return overrides;
}

function hasEditableMetadataChanged(
  draft: EditableMediaDraft,
  baseline: EditableMediaDraft,
  fields: EditableMediaFieldDefinition[],
): boolean {
  return fields.some((field) => draft[field.key] !== baseline[field.key]);
}

function formatEditedFieldLabel(fieldKey: string): string {
  return (
    EDITABLE_MEDIA_FIELD_LABELS.get(fieldKey as EditableMediaFieldKey) ||
    fieldKey
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function ratingBadgeClassName(rating: number): string {
  if (rating <= 3) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/25 dark:text-rose-100";
  }

  if (rating <= 7) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-100";
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-100";
}

function TrackerCardProgressBar({
  item,
  showProgress,
}: {
  item: TrackerItem;
  showProgress: boolean;
}) {
  if (!showProgress || item.status !== "in_progress") return null;

  const mediaType = item.media?.media_type;

  if (mediaType === "book") {
    const currentPage = item.book_current_page;
    const totalPages = item.media?.page_count;
    if (!currentPage || !totalPages) return null;

    const percent = Math.min(100, Math.round((currentPage / totalPages) * 100));
    return (
      <div className="space-y-1 pt-1.5 max-w-xs">
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-primary dark:bg-primary-light transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Page {currentPage}/{totalPages} · {percent}%
        </p>
      </div>
    );
  }

  if (mediaType === "tv") {
    const season = item.tv_current_season;
    const episode = item.tv_current_episode;
    if (!season && !episode) return null;

    return (
      <div className="pt-1.5 max-w-xs">
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className="h-full w-full bg-primary/70 dark:bg-primary-light/70" />
        </div>
      </div>
    );
  }

  return null;
}

function trackerCardProgressLabel(item: TrackerItem): string | null {
  if (item.status !== "in_progress") return null;

  const mediaType = item.media?.media_type;

  if (mediaType === "tv") {
    const season = item.tv_current_season ?? 1;
    const episode = item.tv_current_episode ?? 1;
    return `S${season}E${episode}`;
  }

  if (mediaType === "book") {
    const current = item.book_current_page;
    const total = item.media?.page_count;

    if (current && total) return `Page ${current}/${total}`;
    if (current) return `Page ${current}`;
  }

  return null;
}

function TrackerMediaCard(props: {
  item: TrackerItem;
  onOpen: () => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  onDelete: () => void;
  isBusy: boolean;
  showProgress: boolean;
  hasIntermediateStatus: boolean;
}) {
  const {
    item,
    onOpen,
    onMoveForward,
    onMoveBackward,
    onDelete,
    isBusy,
    showProgress,
    hasIntermediateStatus,
  } = props;
  const hasNote = (item.note || "").trim().length > 0;
  const hasRating = typeof item.rating === "number" && item.rating > 0;
  const hasEditedMetadata = (item.media_edited_fields?.length || 0) > 0;
  const subtitle = item.media?.subtitle;
  const showSubtitle = !shouldHideSubtitle(item.media?.media_type, subtitle);
  const progressLabel = showProgress ? trackerCardProgressLabel(item) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-3 sm:p-4 hover:border-primary/50 dark:hover:border-primary-light/50 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary-light/10 cursor-pointer"
      aria-label={`Open details for ${item.media?.title || "Untitled"}`}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <MediaPoster
            src={item.media?.poster_url}
            alt={item.media?.title || "Untitled"}
            size="sm"
            aspectRatio="2/3"
            showOverlay={false}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              {item.media?.title || "Untitled"}
            </h3>

            {progressLabel && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-500/25 dark:text-violet-100">
                {progressLabel}
              </span>
            )}

            {hasRating && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ratingBadgeClassName(
                  item.rating || 0,
                )}`}
                title={`Your rating: ${item.rating}/10`}
                aria-label={`Rated ${item.rating} out of 10`}
              >
                <Star className="w-3 h-3 fill-current" />
                {item.rating}/10
              </span>
            )}

            {hasNote && (
              <span
                className="inline-flex items-center text-amber-500 dark:text-amber-300"
                title="Has note"
                aria-label="Has note"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
            )}

            {hasEditedMetadata && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100"
                title="Metadata edited"
                aria-label="Metadata edited"
              >
                <Pencil className="w-3 h-3" />
                Edited
              </span>
            )}
          </div>

          {showSubtitle && subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {subtitle}
            </p>
          )}

          {item.media?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {item.media.description}
            </p>
          )}

          <TrackerCardProgressBar item={item} showProgress={showProgress} />
        </div>

        <div className="sm:self-center flex items-center gap-2">
          {item.status !== "want_to" && (
            <Button
              variant="subtle"
              size="icon"
              icon={<RotateCcw className="w-4 h-4" />}
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onMoveBackward();
              }}
              aria-label={moveBackwardLabel(item.status, hasIntermediateStatus)}
              title={moveBackwardLabel(item.status, hasIntermediateStatus)}
              className={backwardButtonClassName()}
            />
          )}

          {item.status !== "done" && (
            <Button
              variant="subtle"
              size="icon"
              icon={<Check className="w-4 h-4" />}
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onMoveForward();
              }}
              aria-label={moveForwardLabel(item.status, hasIntermediateStatus)}
              title={moveForwardLabel(item.status, hasIntermediateStatus)}
              className={forwardButtonClassName(item.status)}
            />
          )}

          <Button
            variant="subtle"
            size="icon"
            icon={<Trash2 className="w-4 h-4" />}
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label="Remove from tracker"
            title="Remove from tracker"
            className={deleteButtonClassName()}
          />
        </div>
      </div>
    </div>
  );
}

function TrackerDetailsModal(props: {
  item: TrackerItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSaveNote: (
    item: TrackerItem,
    note: string,
    rating: number | null,
    completedAt?: string | null,
    progressUpdates?: Partial<
      Pick<
        TrackerItem,
        | "tv_current_season"
        | "tv_current_episode"
        | "book_current_page"
        | "book_chapter_notes"
      >
    >,
  ) => Promise<void>;
  onSaveMetadata: (
    item: TrackerItem,
    mediaOverrides: Record<string, unknown>,
  ) => Promise<void>;
}) {
  const { item, isSaving, onClose, onSaveNote, onSaveMetadata } = props;
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [completedDate, setCompletedDate] = useState("");
  const [tvCurrentSeason, setTvCurrentSeason] = useState("");
  const [tvCurrentEpisode, setTvCurrentEpisode] = useState("");
  const [bookCurrentPage, setBookCurrentPage] = useState("");
  const [chapterNotes, setChapterNotes] = useState<TrackerChapterNote[]>([]);
  const [chapterDraft, setChapterDraft] = useState("");
  const [chapterNoteDraft, setChapterNoteDraft] = useState("");
  const [movieTvDetails, setMovieTvDetails] =
    useState<DetailedMediaInfo | null>(null);
  const [bookDetails, setBookDetails] = useState<BookDetailedInfo | null>(null);
  const [gameDetails, setGameDetails] = useState<GameDetailedInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [seasonEpisodes, setSeasonEpisodes] = useState<
    TvSeasonEpisodeInfo[] | null
  >(null);
  const [isLoadingSeasonEpisodes, setIsLoadingSeasonEpisodes] = useState(false);
  const [seasonEpisodesUnavailable, setSeasonEpisodesUnavailable] =
    useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataDraft, setMetadataDraft] = useState<EditableMediaDraft>(
    emptyEditableMediaDraft,
  );

  useEffect(() => {
    setNote(item?.note || "");
  }, [item?.id, item?.note]);

  useEffect(() => {
    setCompletedDate(toDateInputValue(item?.completed_at));
  }, [item?.id, item?.completed_at]);

  useEffect(() => {
    setRating(item?.rating ?? null);
  }, [item?.id, item?.rating]);

  useEffect(() => {
    setTvCurrentSeason(
      item?.tv_current_season ? String(item.tv_current_season) : "",
    );
  }, [item?.id, item?.tv_current_season]);

  useEffect(() => {
    setTvCurrentEpisode(
      item?.tv_current_episode ? String(item.tv_current_episode) : "",
    );
  }, [item?.id, item?.tv_current_episode]);

  useEffect(() => {
    setBookCurrentPage(
      item?.book_current_page ? String(item.book_current_page) : "",
    );
  }, [item?.id, item?.book_current_page]);

  useEffect(() => {
    setChapterNotes(normalizeChapterNotes(item?.book_chapter_notes));
  }, [item?.id, item?.book_chapter_notes]);

  useEffect(() => {
    setChapterDraft("");
    setChapterNoteDraft("");
  }, [item?.id]);

  useEffect(() => {
    setMetadataDraft(buildEditableMediaDraft(item?.media || null));
    setIsEditingMetadata(false);
  }, [item?.id, item?.media]);

  useEffect(() => {
    let cancelled = false;

    setMovieTvDetails(null);
    setBookDetails(null);
    setGameDetails(null);

    const mediaType = item?.media?.media_type;
    const externalId = item?.media?.external_id;

    if (!mediaType || !externalId) {
      setIsLoadingDetails(false);
      return () => {
        cancelled = true;
      };
    }

    if (
      mediaType !== "movie" &&
      mediaType !== "tv" &&
      mediaType !== "book" &&
      mediaType !== "game"
    ) {
      setIsLoadingDetails(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingDetails(true);

    void (async () => {
      try {
        if (mediaType === "movie" || mediaType === "tv") {
          const details = await getMediaDetailsWithCache(externalId, mediaType);
          if (!cancelled) {
            setMovieTvDetails(details);
          }
          return;
        }

        if (mediaType === "book") {
          const details = await getBookDetailsWithCache(externalId);
          if (!cancelled) {
            setBookDetails(details);
          }
          return;
        }

        const details = await getGameDetailsWithCache(externalId);
        if (!cancelled) {
          setGameDetails(details);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDetails(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.media?.external_id, item?.media?.media_type]);

  const mediaType = item?.media?.media_type;
  const isTv = mediaType === "tv";
  const isBook = mediaType === "book";
  const normalizedTvSeason = toPositiveInt(tvCurrentSeason);

  useEffect(() => {
    let cancelled = false;

    setSeasonEpisodes(null);
    setSeasonEpisodesUnavailable(false);

    const externalId = item?.media?.external_id;
    if (!isTv || !externalId || !normalizedTvSeason) {
      setIsLoadingSeasonEpisodes(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingSeasonEpisodes(true);

    void (async () => {
      try {
        const episodes = await fetchTvSeasonEpisodes(
          externalId,
          normalizedTvSeason,
        );
        if (cancelled) {
          return;
        }

        if (episodes && episodes.length > 0) {
          setSeasonEpisodes(episodes);
          setSeasonEpisodesUnavailable(false);
        } else {
          setSeasonEpisodes([]);
          setSeasonEpisodesUnavailable(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSeasonEpisodes(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.media?.external_id, isTv, normalizedTvSeason]);

  if (!item) {
    return null;
  }

  const originalCompletedDate = toDateInputValue(item.completed_at);
  const completedDateChanged =
    item.status === "done" && completedDate !== originalCompletedDate;

  const tvSeasons =
    isTv && Array.isArray(movieTvDetails?.seasons)
      ? movieTvDetails.seasons.filter((season) => season.season_number > 0)
      : [];

  const selectedTvSeason = normalizedTvSeason
    ? tvSeasons.find((season) => season.season_number === normalizedTvSeason)
    : null;

  const maxSeasonCount =
    isTv && (movieTvDetails?.number_of_seasons || 0) > 0
      ? movieTvDetails?.number_of_seasons || null
      : tvSeasons.length > 0
        ? tvSeasons.length
        : null;

  const totalEpisodes =
    isTv && (movieTvDetails?.number_of_episodes || 0) > 0
      ? movieTvDetails?.number_of_episodes || 0
      : tvSeasons.reduce(
          (total, season) => total + Math.max(0, season.episode_count || 0),
          0,
        );

  const maxEpisodeForSeason = normalizedTvSeason
    ? seasonEpisodes?.length || selectedTvSeason?.episode_count || null
    : null;

  const normalizedTvEpisodeRaw = toPositiveInt(tvCurrentEpisode);
  const normalizedTvEpisode =
    normalizedTvEpisodeRaw && maxEpisodeForSeason
      ? Math.min(normalizedTvEpisodeRaw, maxEpisodeForSeason)
      : normalizedTvEpisodeRaw;

  const watchedEpisodes = (() => {
    if (!isTv || !normalizedTvSeason || !normalizedTvEpisode) {
      return 0;
    }

    const priorSeasonEpisodes = tvSeasons
      .filter((season) => season.season_number < normalizedTvSeason)
      .reduce(
        (total, season) => total + Math.max(0, season.episode_count || 0),
        0,
      );

    if (tvSeasons.length === 0) {
      return normalizedTvEpisode;
    }

    return priorSeasonEpisodes + normalizedTvEpisode;
  })();

  const currentEpisodeTitle =
    normalizedTvEpisode && seasonEpisodes?.length
      ? seasonEpisodes.find(
          (episode) => episode.episode_number === normalizedTvEpisode,
        )?.name || null
      : null;

  const adjustTvSeason = (delta: number) => {
    const currentSeason = normalizedTvSeason ?? 1;
    let nextSeason = Math.max(1, currentSeason + delta);

    if (maxSeasonCount) {
      nextSeason = Math.min(nextSeason, maxSeasonCount);
    }

    setTvCurrentSeason(String(nextSeason));
    if (!normalizedTvEpisode) {
      setTvCurrentEpisode("1");
    }
  };

  const adjustTvEpisode = (delta: number) => {
    const seasonValue = normalizedTvSeason ?? 1;
    if (!normalizedTvSeason) {
      setTvCurrentSeason(String(seasonValue));
    }

    const currentEpisode = normalizedTvEpisode ?? 1;
    let nextEpisode = Math.max(1, currentEpisode + delta);

    if (maxEpisodeForSeason) {
      nextEpisode = Math.min(nextEpisode, maxEpisodeForSeason);
    }

    setTvCurrentEpisode(String(nextEpisode));
  };

  const overallCompletionPercent =
    isTv && totalEpisodes > 0
      ? Math.min(100, Math.round((watchedEpisodes / totalEpisodes) * 100))
      : null;

  const normalizedBookCurrentPage = toPositiveInt(bookCurrentPage);
  const effectiveBookPageCount =
    bookDetails?.page_count || item.media?.page_count || null;
  const safeBookCurrentPage =
    normalizedBookCurrentPage && effectiveBookPageCount
      ? Math.min(normalizedBookCurrentPage, effectiveBookPageCount)
      : normalizedBookCurrentPage;

  const bookCompletionPercent =
    isBook && effectiveBookPageCount && safeBookCurrentPage
      ? Math.min(
          100,
          Math.round((safeBookCurrentPage / effectiveBookPageCount) * 100),
        )
      : null;

  const normalizedChapterNotes = normalizeChapterNotes(chapterNotes);
  const originalChapterNotes = normalizeChapterNotes(item.book_chapter_notes);

  const tvProgressChanged =
    isTv &&
    ((item.tv_current_season ?? null) !== (normalizedTvSeason ?? null) ||
      (item.tv_current_episode ?? null) !== (normalizedTvEpisode ?? null));

  const bookProgressChanged =
    isBook &&
    ((item.book_current_page ?? null) !== (safeBookCurrentPage ?? null) ||
      JSON.stringify(normalizedChapterNotes) !==
        JSON.stringify(originalChapterNotes));

  const progressChanged = tvProgressChanged || bookProgressChanged;

  const handleSaveAndClose = async () => {
    const completedAt =
      item.status === "done" ? toCompletedAtIso(completedDate) : undefined;

    await onSaveNote(item, note, rating, completedAt);
    onClose();
  };

  const handleSaveProgress = async () => {
    const progressUpdates: Partial<
      Pick<
        TrackerItem,
        | "tv_current_season"
        | "tv_current_episode"
        | "book_current_page"
        | "book_chapter_notes"
      >
    > = {};

    if (isTv) {
      progressUpdates.tv_current_season = normalizedTvSeason;
      progressUpdates.tv_current_episode = normalizedTvSeason
        ? normalizedTvEpisode
        : null;
    }

    if (isBook) {
      progressUpdates.book_current_page = safeBookCurrentPage;
      progressUpdates.book_chapter_notes = normalizedChapterNotes;
    }

    await onSaveNote(item, note, rating, undefined, progressUpdates);
  };

  const handleAddChapterNote = () => {
    const chapter = chapterDraft.trim();
    const chapterNote = chapterNoteDraft.trim();

    if (!chapter || !chapterNote) {
      return;
    }

    const newNote: TrackerChapterNote = {
      id: crypto.randomUUID(),
      chapter,
      note: chapterNote,
      created_at: new Date().toISOString(),
    };

    setChapterNotes((current) => [...current, newNote]);
    setChapterDraft("");
    setChapterNoteDraft("");
  };

  const handleRemoveChapterNote = (noteId: string) => {
    setChapterNotes((current) =>
      current.filter((noteEntry) => noteEntry.id !== noteId),
    );
  };

  const handleSaveMetadata = async () => {
    const overrides = buildMediaOverridesFromDraft(
      metadataDraft,
      editableMetadataFields,
    );
    await onSaveMetadata(item, overrides);
    setIsEditingMetadata(false);
  };

  const noteChanged = note.trim() !== (item.note || "").trim();
  const ratingChanged =
    item.status === "done" && (item.rating ?? null) !== rating;
  const editableMetadataFields = getEditableMediaFields(mediaType);
  const currentMediaDraft = buildEditableMediaDraft(item.media);
  const metadataChanged = hasEditableMetadataChanged(
    metadataDraft,
    currentMediaDraft,
    editableMetadataFields,
  );
  const editedFieldLabels = Array.from(
    new Set((item.media_edited_fields || []).map(formatEditedFieldLabel)),
  );
  const historyDateLabel =
    mediaType === "book"
      ? "Date Read"
      : mediaType === "game"
        ? "Date Played"
        : mediaType === "song" || mediaType === "album"
          ? "Date Listened"
          : "Date Watched";

  const detailRows: Array<{
    label: string;
    value: string;
    fullWidth?: boolean;
  }> = [];

  const mediaGenres =
    movieTvDetails?.genres?.join(", ") ||
    gameDetails?.genres ||
    item.media?.genres;

  const releaseDate =
    movieTvDetails?.release_date ||
    bookDetails?.release_date ||
    gameDetails?.release_date ||
    item.media?.release_date;

  const releaseLabel = formatReleaseDate(releaseDate);
  if (releaseLabel) {
    detailRows.push({ label: "Release", value: releaseLabel });
  }

  if (mediaGenres) {
    detailRows.push({ label: "Genre", value: mediaGenres });
  }

  if (mediaType === "movie" || mediaType === "tv") {
    if (movieTvDetails?.director) {
      detailRows.push({ label: "Director", value: movieTvDetails.director });
    }

    if (movieTvDetails?.cast?.length) {
      detailRows.push({
        label: "Cast",
        value: movieTvDetails.cast.slice(0, 8).join(", "),
        fullWidth: true,
      });
    }

    if (movieTvDetails?.runtime) {
      detailRows.push({
        label: "Runtime",
        value: `${movieTvDetails.runtime} min`,
      });
    }

    if (movieTvDetails?.imdb_rating) {
      detailRows.push({
        label: "IMDb",
        value: `${movieTvDetails.imdb_rating}/10`,
      });
    }

    if (movieTvDetails?.rotten_tomatoes_score) {
      detailRows.push({
        label: "Rotten Tomatoes",
        value: `${movieTvDetails.rotten_tomatoes_score}%`,
      });
    }

    if (movieTvDetails?.metacritic_score) {
      detailRows.push({
        label: "Metacritic",
        value: `${movieTvDetails.metacritic_score}/100`,
      });
    }
  }

  if (mediaType === "book") {
    const authors = bookDetails?.authors || item.media?.authors;
    const publisher = bookDetails?.publisher || item.media?.publisher;
    const categories = bookDetails?.categories;
    const pageCount = bookDetails?.page_count || item.media?.page_count;
    const isbn = bookDetails?.isbn || item.media?.isbn;

    if (authors) {
      detailRows.push({ label: "Author", value: authors, fullWidth: true });
    }

    if (publisher) {
      detailRows.push({ label: "Publisher", value: publisher });
    }

    if (pageCount) {
      detailRows.push({ label: "Pages", value: String(pageCount) });
    }

    if (bookDetails?.average_rating) {
      detailRows.push({
        label: "Avg Rating",
        value: `${bookDetails.average_rating.toFixed(1)}/5`,
      });
    }

    if (categories) {
      detailRows.push({
        label: "Category",
        value: categories,
        fullWidth: true,
      });
    }

    if (isbn) {
      detailRows.push({ label: "ISBN", value: isbn, fullWidth: true });
    }
  }

  if (mediaType === "game") {
    const platforms = gameDetails?.platforms || item.media?.platforms;
    const metacritic = gameDetails?.metacritic || item.media?.metacritic;
    const rating = gameDetails?.rating;
    const playtime = gameDetails?.playtime || item.media?.playtime;

    if (platforms) {
      detailRows.push({
        label: "Platforms",
        value: platforms,
        fullWidth: true,
      });
    }

    if (metacritic) {
      detailRows.push({ label: "Metacritic", value: `${metacritic}/100` });
    }

    if (rating) {
      detailRows.push({ label: "Rating", value: `${rating.toFixed(1)}/5` });
    }

    if (playtime) {
      detailRows.push({
        label: "Avg Playtime",
        value: formatPlaytime(playtime),
      });
    }
  }

  if (
    mediaType === "song" ||
    mediaType === "album" ||
    mediaType === "playlist"
  ) {
    if (item.media?.artist) {
      detailRows.push({
        label: "Artist",
        value: item.media.artist,
        fullWidth: true,
      });
    }

    if (item.media?.album && mediaType === "song") {
      detailRows.push({
        label: "Album",
        value: item.media.album,
        fullWidth: true,
      });
    }

    if (item.media?.track_count && mediaType !== "song") {
      detailRows.push({
        label: "Tracks",
        value: String(item.media.track_count),
      });
    }

    if (item.media?.track_duration && mediaType === "song") {
      detailRows.push({
        label: "Duration",
        value: formatTrackDuration(item.media.track_duration),
      });
    }
  }

  const compactDetailRows = detailRows.filter((row) => !row.fullWidth);
  const fullWidthDetailRows = detailRows.filter((row) => row.fullWidth);
  const leftColumnRows = compactDetailRows.filter(
    (_, index) => index % 2 === 0,
  );
  const rightColumnRows = compactDetailRows.filter(
    (_, index) => index % 2 === 1,
  );

  return (
    <Modal
      isOpen={Boolean(item)}
      onClose={onClose}
      title={item.media?.title || "Tracker Item"}
      maxWidth="4xl"
    >
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <MediaPoster
              src={item.media?.poster_url}
              alt={item.media?.title || "Untitled"}
              size="md"
              aspectRatio="2/3"
              showOverlay={false}
              className="w-40"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {item.media?.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.media.subtitle}
              </p>
            )}

            {item.media?.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.media.description}
              </p>
            )}

            <div className="space-y-5">
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-primary dark:text-primary-light">
                    More Details
                  </h4>

                  <div className="flex items-center gap-2">
                    {editedFieldLabels.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100">
                        <Pencil className="w-3 h-3" />
                        Edited
                      </span>
                    )}

                    <Button
                      variant={isEditingMetadata ? "subtle" : "secondary"}
                      size="sm"
                      icon={<Pencil className="w-4 h-4" />}
                      onClick={() => {
                        if (isEditingMetadata) {
                          setMetadataDraft(currentMediaDraft);
                          setIsEditingMetadata(false);
                          return;
                        }

                        setMetadataDraft(currentMediaDraft);
                        setIsEditingMetadata(true);
                      }}
                    >
                      {isEditingMetadata ? "Cancel Edit" : "Edit Metadata"}
                    </Button>
                  </div>
                </div>

                {!isEditingMetadata && editedFieldLabels.length > 0 && (
                  <p className="text-xs text-sky-700 dark:text-sky-200">
                    Changed fields: {editedFieldLabels.join(", ")}
                  </p>
                )}

                {isEditingMetadata ? (
                  <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editableMetadataFields
                        .filter((field) => field.kind !== "textarea")
                        .map((field) => (
                          <div key={field.key} className="space-y-1">
                            <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                              {field.label}
                            </p>
                            {field.kind === "date" ? (
                              <ThemedDatePicker
                                id={`tracker-metadata-${item.id}-${field.key}`}
                                value={metadataDraft[field.key]}
                                onChange={(nextValue) =>
                                  setMetadataDraft((current) => ({
                                    ...current,
                                    [field.key]: nextValue,
                                  }))
                                }
                                ariaLabel={field.label}
                                className="w-full"
                              />
                            ) : (
                              <input
                                type={
                                  field.kind === "number" ? "number" : "text"
                                }
                                value={metadataDraft[field.key]}
                                onChange={(event) =>
                                  setMetadataDraft((current) => ({
                                    ...current,
                                    [field.key]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                              />
                            )}
                          </div>
                        ))}
                    </div>

                    {editableMetadataFields
                      .filter((field) => field.kind === "textarea")
                      .map((field) => (
                        <div key={field.key} className="space-y-1">
                          <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                            {field.label}
                          </p>
                          <textarea
                            value={metadataDraft[field.key]}
                            onChange={(event) =>
                              setMetadataDraft((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                          />
                        </div>
                      ))}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => {
                          setMetadataDraft(currentMediaDraft);
                          setIsEditingMetadata(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!metadataChanged || isSaving}
                        onClick={() => void handleSaveMetadata()}
                      >
                        Save Metadata
                      </Button>
                    </div>
                  </div>
                ) : isLoadingDetails ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading details...
                  </p>
                ) : (
                  <>
                    {compactDetailRows.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <dl className="space-y-2">
                          {leftColumnRows.map((row) => (
                            <div key={`${row.label}-${row.value}`}>
                              <dt className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                                {row.label}
                              </dt>
                              <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>

                        <dl className="space-y-2">
                          {rightColumnRows.map((row) => (
                            <div key={`${row.label}-${row.value}`}>
                              <dt className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                                {row.label}
                              </dt>
                              <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {fullWidthDetailRows.length > 0 && (
                      <dl className="space-y-2 border-t border-gray-200/80 dark:border-gray-700/80 pt-3">
                        {fullWidthDetailRows.map((row) => (
                          <div key={`${row.label}-${row.value}`}>
                            <dt className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                              {row.label}
                            </dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </>
                )}
              </section>

              {item.status !== "done" && (isTv || isBook) && (
                <section className="space-y-3 border-t border-gray-200/80 dark:border-gray-700/80 pt-4">
                  <h4 className="text-sm font-semibold text-primary dark:text-primary-light">
                    Progress
                  </h4>

                  {isTv && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                            Current Season
                          </p>
                          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2">
                            <Button
                              variant="subtle"
                              size="icon"
                              icon={<Minus className="w-4 h-4" />}
                              aria-label="Decrease current season"
                              title="Decrease current season"
                              onClick={() => adjustTvSeason(-1)}
                              disabled={
                                isSaving || (normalizedTvSeason ?? 1) <= 1
                              }
                              className="h-8 w-8"
                            />
                            <div className="w-[120px] text-center">
                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                S{normalizedTvSeason || 1}
                              </p>
                              <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                                {selectedTvSeason?.name ||
                                  (normalizedTvSeason
                                    ? `Season ${normalizedTvSeason}`
                                    : "Season not available")}
                              </p>
                            </div>
                            <Button
                              variant="subtle"
                              size="icon"
                              icon={<Plus className="w-4 h-4" />}
                              aria-label="Increase current season"
                              title="Increase current season"
                              onClick={() => adjustTvSeason(1)}
                              disabled={
                                isSaving ||
                                (maxSeasonCount !== null &&
                                  (normalizedTvSeason || 1) >= maxSeasonCount)
                              }
                              className="h-8 w-8"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                            Current Episode
                          </p>
                          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2">
                            <Button
                              variant="subtle"
                              size="icon"
                              icon={<Minus className="w-4 h-4" />}
                              aria-label="Decrease current episode"
                              title="Decrease current episode"
                              onClick={() => adjustTvEpisode(-1)}
                              disabled={
                                isSaving || (normalizedTvEpisode ?? 1) <= 1
                              }
                              className="h-8 w-8"
                            />
                            <div className="w-[120px] text-center">
                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                E{normalizedTvEpisode || 1}
                              </p>
                              <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                                {currentEpisodeTitle ||
                                  "Episode title not loaded"}
                              </p>
                            </div>
                            <Button
                              variant="subtle"
                              size="icon"
                              icon={<Plus className="w-4 h-4" />}
                              aria-label="Increase current episode"
                              title="Increase current episode"
                              onClick={() => adjustTvEpisode(1)}
                              disabled={
                                isSaving ||
                                (maxEpisodeForSeason !== null &&
                                  (normalizedTvEpisode || 1) >=
                                    maxEpisodeForSeason)
                              }
                              className="h-8 w-8"
                            />
                          </div>
                        </div>
                      </div>

                      {isLoadingSeasonEpisodes && normalizedTvSeason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading episode names for Season {normalizedTvSeason}
                        </p>
                      )}

                      {!isLoadingSeasonEpisodes &&
                        seasonEpisodesUnavailable &&
                        normalizedTvSeason && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Episode names are not available for this
                            show/season. Manual tracking is still enabled.
                          </p>
                        )}

                      {totalEpisodes > 0 ? (
                        <div className="space-y-1.5">
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full bg-primary dark:bg-primary-light transition-all"
                              style={{
                                width: `${overallCompletionPercent || 0}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            S{normalizedTvSeason || "-"}E
                            {normalizedTvEpisode || "-"} · {watchedEpisodes}/
                            {totalEpisodes} episodes (
                            {overallCompletionPercent || 0}%)
                          </p>
                        </div>
                      ) : tvSeasons.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Episode totals are not available for this show. Manual
                          tracking is still enabled.
                        </p>
                      ) : null}
                    </div>
                  )}

                  {isBook && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                          Current Page
                        </p>
                        <input
                          type="number"
                          min={1}
                          value={bookCurrentPage}
                          onChange={(event) =>
                            setBookCurrentPage(event.target.value)
                          }
                          placeholder="e.g. 142"
                          className="w-full max-w-[220px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        />
                      </div>

                      {effectiveBookPageCount && (
                        <div className="space-y-1.5">
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full bg-primary dark:bg-primary-light transition-all"
                              style={{
                                width: `${bookCompletionPercent || 0}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Page {safeBookCurrentPage || 0}/
                            {effectiveBookPageCount} (
                            {bookCompletionPercent || 0}%)
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 border-t border-gray-200/80 dark:border-gray-700/80 pt-3">
                        <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                          Chapter Notes
                        </p>
                        <input
                          type="text"
                          value={chapterDraft}
                          onChange={(event) =>
                            setChapterDraft(event.target.value)
                          }
                          placeholder="Chapter label (e.g. Chapter 7)"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        />
                        <Textarea
                          id={`tracker-chapter-note-${item.id}`}
                          value={chapterNoteDraft}
                          onChange={(event) =>
                            setChapterNoteDraft(event.target.value)
                          }
                          placeholder="What stood out in this chapter?"
                          rows={3}
                          textareaClassName="rounded-xl"
                        />
                        <div className="flex justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAddChapterNote}
                            disabled={
                              chapterDraft.trim().length === 0 ||
                              chapterNoteDraft.trim().length === 0
                            }
                          >
                            Add Chapter Note
                          </Button>
                        </div>

                        {normalizedChapterNotes.length > 0 && (
                          <div className="space-y-2">
                            {normalizedChapterNotes.map((chapterEntry) => (
                              <div
                                key={chapterEntry.id}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                      {chapterEntry.chapter}
                                    </p>
                                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                                      {chapterEntry.note}
                                    </p>
                                  </div>
                                  <Button
                                    variant="subtle"
                                    size="icon"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    aria-label="Remove chapter note"
                                    title="Remove chapter note"
                                    onClick={() =>
                                      handleRemoveChapterNote(chapterEntry.id)
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!progressChanged || isSaving}
                      onClick={() => void handleSaveProgress()}
                    >
                      Save Progress
                    </Button>
                  </div>
                </section>
              )}

              {item.status === "done" && (
                <section className="space-y-3 border-t border-gray-200/80 dark:border-gray-700/80 pt-4">
                  <h4 className="text-sm font-semibold text-primary dark:text-primary-light">
                    Edit
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                        {historyDateLabel}
                      </p>
                      <ThemedDatePicker
                        id={`tracker-completed-date-${item.id}`}
                        value={completedDate}
                        onChange={setCompletedDate}
                        ariaLabel={historyDateLabel}
                        className="max-w-[220px]"
                        helperText="Auto-set when marked complete."
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                        Rating
                      </p>
                      <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        maxRating={10}
                        size="xs"
                        showClearButton
                        className="!gap-1"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Rate this item out of 10 stars.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-200">
                      Personal Note
                    </p>
                    <Textarea
                      id={`tracker-note-${item.id}`}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Private note about this item"
                      rows={4}
                      textareaClassName="rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={
                        (!noteChanged &&
                          !completedDateChanged &&
                          !ratingChanged) ||
                        isSaving
                      }
                      onClick={() => void handleSaveAndClose()}
                    >
                      Save Changes
                    </Button>
                  </div>
                </section>
              )}

            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function TrackerMediaGridCard(props: {
  item: TrackerItem;
  onOpen: () => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  onDelete: () => void;
  isBusy: boolean;
  showProgress: boolean;
  hasIntermediateStatus: boolean;
}) {
  const {
    item,
    onOpen,
    onMoveForward,
    onMoveBackward,
    onDelete,
    isBusy,
    showProgress,
    hasIntermediateStatus,
  } = props;
  const hasNote = (item.note || "").trim().length > 0;
  const hasRating = typeof item.rating === "number" && item.rating > 0;
  const hasEditedMetadata = (item.media_edited_fields?.length || 0) > 0;
  const subtitle = item.media?.subtitle;
  const showSubtitle = !shouldHideSubtitle(item.media?.media_type, subtitle);
  const progressLabel = showProgress ? trackerCardProgressLabel(item) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-gray-800/80 p-2.5 hover:border-primary/50 dark:hover:border-primary-light/50 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary-light/10 cursor-pointer flex flex-col"
      aria-label={`Open details for ${item.media?.title || "Untitled"}`}
    >
      <MediaPoster
        src={item.media?.poster_url}
        alt={item.media?.title || "Untitled"}
        size="md"
        aspectRatio="2/3"
        showOverlay={false}
        className="mx-auto w-[52%]"
      />

      <div className="mt-2 flex flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-1.5">
          <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white line-clamp-2 pr-1">
            {item.media?.title || "Untitled"}
          </h3>
        </div>

        {progressLabel && (
          <div>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-500/25 dark:text-violet-100">
              {progressLabel}
            </span>
          </div>
        )}

        {showSubtitle && subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {subtitle}
          </p>
        )}

        {item.media?.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {item.media.description}
          </p>
        )}

        <TrackerCardProgressBar item={item} showProgress={showProgress} />

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            {hasNote && (
              <span
                className="inline-flex items-center text-amber-500 dark:text-amber-300"
                title="Has note"
                aria-label="Has note"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
            )}

            {hasRating && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${ratingBadgeClassName(
                  item.rating || 0,
                )}`}
                title={`Your rating: ${item.rating}/10`}
                aria-label={`Rated ${item.rating} out of 10`}
              >
                <Star className="w-3 h-3 fill-current" />
                {item.rating}/10
              </span>
            )}

            {hasEditedMetadata && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100"
                title="Metadata edited"
                aria-label="Metadata edited"
              >
                <Pencil className="w-3 h-3" />
                Edited
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center justify-end gap-1.5">
            {item.status !== "want_to" && (
              <Button
                variant="subtle"
                size="icon"
                icon={<RotateCcw className="w-4 h-4" />}
                disabled={isBusy}
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveBackward();
                }}
                aria-label={moveBackwardLabel(
                  item.status,
                  hasIntermediateStatus,
                )}
                title={moveBackwardLabel(item.status, hasIntermediateStatus)}
                className={backwardButtonClassName("sm")}
              />
            )}

            {item.status !== "done" && (
              <Button
                variant="subtle"
                size="icon"
                icon={<Check className="w-4 h-4" />}
                disabled={isBusy}
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveForward();
                }}
                aria-label={moveForwardLabel(
                  item.status,
                  hasIntermediateStatus,
                )}
                title={moveForwardLabel(item.status, hasIntermediateStatus)}
                className={forwardButtonClassName(item.status, "sm")}
              />
            )}

            <Button
              variant="subtle"
              size="icon"
              icon={<Trash2 className="w-4 h-4" />}
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              aria-label="Remove from tracker"
              title="Remove from tracker"
              className={deleteButtonClassName("sm")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface TrackerPageProps {
  scope?: TrackerScopeId;
}

export default function TrackerPage({ scope }: TrackerPageProps) {
  const resolvedScope = resolveTrackerScope(scope);
  const scopeConfig = TRACKER_SCOPES[resolvedScope];
  const scopeHasIntermediateStatus = hasInProgressTab(resolvedScope);

  usePageMeta({
    ...PAGE_META_BASE,
    title: scopeConfig.pageTitle,
    description: scopeConfig.pageDescription,
  });

  const [viewMode, setViewMode] = useState<ViewMode>(
    defaultViewMode(resolvedScope),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [cardLayout, setCardLayout] = useState<CardLayout>("list");

  useEffect(() => {
    setMediaFilter("all");
    setSearchQuery("");
    setSelectedItemId(null);
    setPendingDeleteId(null);
    setToast(null);
    setViewMode(defaultViewMode(resolvedScope));
  }, [resolvedScope]);

  const { data: activeItems = [], isLoading: activeLoading } =
    useTrackerItems("active");
  const { data: historyItems = [], isLoading: historyLoading } =
    useTrackerItems("done");

  const addTrackerItem = useAddTrackerItem();
  const updateTrackerItem = useUpdateTrackerItem();
  const removeTrackerItem = useRemoveTrackerItem();

  const scopedActiveItems = useMemo(
    () =>
      activeItems.filter((item) =>
        mediaTypeAllowedInScope(item.media?.media_type, resolvedScope),
      ),
    [activeItems, resolvedScope],
  );

  const scopedHistoryItems = useMemo(
    () =>
      historyItems.filter((item) =>
        mediaTypeAllowedInScope(item.media?.media_type, resolvedScope),
      ),
    [historyItems, resolvedScope],
  );

  const scopedTodoItems = useMemo(
    () => scopedActiveItems.filter((item) => item.status === "want_to"),
    [scopedActiveItems],
  );

  const scopedInProgressItems = useMemo(
    () => scopedActiveItems.filter((item) => item.status === "in_progress"),
    [scopedActiveItems],
  );

  const scopedCompleteItems = scopedHistoryItems;

  const allTrackerItems = useMemo(
    () => [...scopedActiveItems, ...scopedHistoryItems],
    [scopedActiveItems, scopedHistoryItems],
  );

  const trackerItems = useMemo(() => {
    if (hasSingleFavoritesTab(resolvedScope)) {
      return allTrackerItems;
    }

    if (viewMode === "complete") {
      return scopedCompleteItems;
    }

    if (viewMode === "in_progress") {
      return scopedInProgressItems;
    }

    if (hasInProgressTab(resolvedScope)) {
      return scopedTodoItems;
    }

    return scopedActiveItems;
  }, [
    allTrackerItems,
    resolvedScope,
    scopedActiveItems,
    scopedCompleteItems,
    scopedInProgressItems,
    scopedTodoItems,
    viewMode,
  ]);

  const isLoading =
    viewMode === "favorites"
      ? activeLoading || historyLoading
      : viewMode === "complete"
        ? historyLoading
        : activeLoading;

  const filteredItems = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    const filteredByType =
      mediaFilter === "all"
        ? trackerItems
        : trackerItems.filter((item) => item.media?.media_type === mediaFilter);

    const searched =
      search.length === 0
        ? filteredByType
        : filteredByType.filter((item) => {
            const haystack = [
              item.media?.title || "",
              item.media?.subtitle || "",
              item.media?.description || "",
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(search);
          });

    const sorted = [...searched];

    sorted.sort((a, b) => {
      if (sortMode === "title") {
        return (a.media?.title || "").localeCompare(b.media?.title || "");
      }

      if (sortMode === "year") {
        return (b.media?.year || 0) - (a.media?.year || 0);
      }

      if (sortMode === "added") {
        return (b.created_at || "").localeCompare(a.created_at || "");
      }

      if (sortMode === "completed") {
        return (b.completed_at || "").localeCompare(a.completed_at || "");
      }

      if (sortMode === "rating") {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        return (b.completed_at || "").localeCompare(a.completed_at || "");
      }

      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });

    return sorted;
  }, [trackerItems, mediaFilter, searchQuery, sortMode]);

  const existingItems = useMemo(
    () =>
      allTrackerItems
        .filter((item) => item.media)
        .map((item) => ({
          external_id: item.media?.external_id || "",
          media_type: item.media?.media_type || "",
        })),
    [allTrackerItems],
  );

  const selectedItem = useMemo(
    () => allTrackerItems.find((item) => item.id === selectedItemId) || null,
    [allTrackerItems, selectedItemId],
  );

  const pendingDeleteItem = useMemo(
    () => allTrackerItems.find((item) => item.id === pendingDeleteId) || null,
    [allTrackerItems, pendingDeleteId],
  );

  const filterSections = useMemo(
    () => [
      ...(scopeConfig.mediaTypes.length > 1
        ? [
            {
              id: "mediaType",
              title: "Media Type",
              options: [
                { id: "all", label: `All ${scopeConfig.label}` },
                ...scopeConfig.mediaTypes.map((mediaType) => ({
                  id: mediaType,
                  label: mediaLabel(mediaType),
                })),
              ],
            },
          ]
        : []),
      {
        id: "sort",
        title: "Sort By",
        options: [
          { id: "recent", label: "Recently Updated" },
          { id: "title", label: "Title (A-Z)" },
          { id: "year", label: "Year" },
          { id: "added", label: "Date Added" },
          { id: "completed", label: "Completed Date" },
          ...(viewMode === "complete" || viewMode === "favorites"
            ? [{ id: "rating", label: "Rating" }]
            : []),
        ],
      },
    ],
    [scopeConfig.label, scopeConfig.mediaTypes, viewMode],
  );

  useEffect(() => {
    if (
      viewMode !== "complete" &&
      viewMode !== "favorites" &&
      sortMode === "rating"
    ) {
      setSortMode("recent");
    }
  }, [sortMode, viewMode]);

  const handleMoveForward = async (item: TrackerItem) => {
    if (item.status === "done") {
      return;
    }

    const itemHasIntermediateStatus =
      scopeHasIntermediateStatus && item.media?.media_type === "tv";
    const nextStatus: TrackerStatus =
      item.status === "want_to"
        ? itemHasIntermediateStatus
          ? "in_progress"
          : "done"
        : "done";

    await updateTrackerItem.mutateAsync({
      trackerItemId: item.id,
      updates: { status: nextStatus },
    });

    setToast({
      message:
        nextStatus === "in_progress"
          ? "Moved to in progress"
          : "Marked complete",
    });
  };

  const handleMoveBackward = async (item: TrackerItem) => {
    if (item.status === "want_to") {
      return;
    }

    const itemHasIntermediateStatus =
      scopeHasIntermediateStatus && item.media?.media_type === "tv";
    const previousStatus: TrackerStatus =
      item.status === "done"
        ? itemHasIntermediateStatus
          ? "in_progress"
          : "want_to"
        : "want_to";

    await updateTrackerItem.mutateAsync({
      trackerItemId: item.id,
      updates: {
        status: previousStatus,
      },
    });

    setToast({
      message:
        previousStatus === "in_progress"
          ? "Moved to in progress"
          : "Moved to to-do",
    });
  };

  const handleSaveNote = async (
    item: TrackerItem,
    note: string,
    rating: number | null,
    completedAt?: string | null,
    progressUpdates?: Partial<
      Pick<
        TrackerItem,
        | "tv_current_season"
        | "tv_current_episode"
        | "book_current_page"
        | "book_chapter_notes"
      >
    >,
  ) => {
    const trimmed = note.trim();
    const updates: Partial<
      Pick<
        TrackerItem,
        | "note"
        | "completed_at"
        | "rating"
        | "tv_current_season"
        | "tv_current_episode"
        | "book_current_page"
        | "book_chapter_notes"
      >
    > = {
      note: trimmed.length > 0 ? trimmed : null,
    };

    if (item.status === "done") {
      updates.rating = rating;
    }

    if (item.status === "done" && completedAt !== undefined) {
      updates.completed_at = completedAt;
    }

    if (progressUpdates) {
      if ("tv_current_season" in progressUpdates) {
        updates.tv_current_season = progressUpdates.tv_current_season ?? null;
      }
      if ("tv_current_episode" in progressUpdates) {
        updates.tv_current_episode = progressUpdates.tv_current_episode ?? null;
      }
      if ("book_current_page" in progressUpdates) {
        updates.book_current_page = progressUpdates.book_current_page ?? null;
      }
      if ("book_chapter_notes" in progressUpdates) {
        updates.book_chapter_notes = progressUpdates.book_chapter_notes ?? [];
      }
    }

    await updateTrackerItem.mutateAsync({
      trackerItemId: item.id,
      updates,
    });
  };

  const handleSaveMetadata = async (
    item: TrackerItem,
    mediaOverrides: Record<string, unknown>,
  ) => {
    await updateTrackerItem.mutateAsync({
      trackerItemId: item.id,
      updates: {
        media_overrides: mediaOverrides,
      },
    });
  };

  const handleRequestDelete = (item: TrackerItem) => {
    setPendingDeleteId(item.id);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) {
      return;
    }

    await removeTrackerItem.mutateAsync(pendingDeleteId);

    if (selectedItemId === pendingDeleteId) {
      setSelectedItemId(null);
    }

    setPendingDeleteId(null);
  };

  const isItemActionPending =
    updateTrackerItem.isPending || removeTrackerItem.isPending;

  const tabs = useMemo(() => {
    if (hasSingleFavoritesTab(resolvedScope)) {
      return [
        {
          id: "favorites",
          label: "Favorite Songs",
          badge: allTrackerItems.length,
        },
      ];
    }

    if (hasInProgressTab(resolvedScope)) {
      return [
        {
          id: "todo",
          label: "To-Do",
          badge: scopedTodoItems.length,
        },
        {
          id: "in_progress",
          label: "In Progress",
          badge: scopedInProgressItems.length,
        },
        {
          id: "complete",
          label: "Complete",
          badge: scopedCompleteItems.length,
        },
      ];
    }

    return [
      {
        id: "todo",
        label: "To-Do",
        badge: scopedActiveItems.length,
      },
      {
        id: "complete",
        label: "Complete",
        badge: scopedCompleteItems.length,
      },
    ];
  }, [
    allTrackerItems.length,
    resolvedScope,
    scopedActiveItems.length,
    scopedCompleteItems.length,
    scopedInProgressItems.length,
    scopedTodoItems.length,
  ]);

  return (
    <AppLayout
      title={scopeConfig.pageTitle}
      description={scopeConfig.pageDescription}
      tabs={tabs}
      activeTab={viewMode}
      onTabChange={(tabId) => setViewMode(tabId as ViewMode)}
      tabsRightActions={
        <ViewModeToggle
          value={cardLayout}
          onChange={setCardLayout}
          optionsLabel="Tracker view"
        />
      }
    >
      <div className="container mx-auto px-4 sm:px-6 space-y-4">
        <MediaPageToolbar
          filterConfig={{
            type: "menu",
            sections: filterSections,
            activeFilters: {
              mediaType: mediaFilter,
              sort: sortMode,
            },
            onFilterChange: (sectionId, filterId) => {
              if (sectionId === "mediaType") {
                setMediaFilter(filterId as MediaFilter);
              }

              if (sectionId === "sort") {
                setSortMode(filterId as SortMode);
              }
            },
          }}
          searchConfig={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: `Search ${scopeConfig.label}...`,
          }}
          onAddClick={() => setShowAddModal(true)}
          addLabel="+ Add"
        />

        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading tracker...
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={viewMode === "complete" ? BookOpen : Film}
            title={
              viewMode === "favorites"
                ? "No favorite songs yet"
                : viewMode === "complete"
                  ? "Nothing completed yet"
                  : viewMode === "in_progress"
                    ? "Nothing in progress right now"
                    : "Nothing in your to-do list"
            }
            description={
              searchQuery || mediaFilter !== "all"
                ? "No tracker items match your current search and filters."
                : viewMode === "favorites"
                  ? "Add songs or albums and use status actions to build your favorites list."
                  : viewMode === "complete"
                    ? "Move items through in progress to build your completed list."
                    : viewMode === "in_progress"
                      ? "Use the check action on to-do items to start progress."
                      : `Add ${scopeConfig.label.toLowerCase()} and start tracking.`
            }
          />
        ) : cardLayout === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 pb-2">
            {filteredItems.map((item) => (
              <TrackerMediaGridCard
                key={item.id}
                item={item}
                isBusy={isItemActionPending}
                onOpen={() => setSelectedItemId(item.id)}
                onMoveForward={() => void handleMoveForward(item)}
                onMoveBackward={() => void handleMoveBackward(item)}
                onDelete={() => handleRequestDelete(item)}
                showProgress={viewMode !== "complete"}
                hasIntermediateStatus={scopeHasIntermediateStatus}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {filteredItems.map((item) => (
              <TrackerMediaCard
                key={item.id}
                item={item}
                isBusy={isItemActionPending}
                onOpen={() => setSelectedItemId(item.id)}
                onMoveForward={() => void handleMoveForward(item)}
                onMoveBackward={() => void handleMoveBackward(item)}
                onDelete={() => handleRequestDelete(item)}
                showProgress={viewMode !== "complete"}
                hasIntermediateStatus={scopeHasIntermediateStatus}
              />
            ))}
          </div>
        )}
      </div>

      <TrackerDetailsModal
        item={selectedItem}
        isSaving={updateTrackerItem.isPending}
        onClose={() => setSelectedItemId(null)}
        onSaveNote={handleSaveNote}
        onSaveMetadata={handleSaveMetadata}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingDeleteItem)}
        onClose={() => {
          if (!removeTrackerItem.isPending) {
            setPendingDeleteId(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove from tracker?"
        message={`Are you sure you want to remove "${pendingDeleteItem?.media?.title || "this item"}" from your tracker?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={removeTrackerItem.isPending}
      />

      <AddMediaFromCatalogModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add ${scopeConfig.label} To Tracker`}
        emptyHint={`Search ${scopeConfig.label.toLowerCase()} to add to this tracker.`}
        addLabel="Track"
        searchScope={scopeConfig.searchScope}
        lockSearchScope={true}
        searchPlaceholder={`Search ${scopeConfig.label.toLowerCase()}...`}
        existingItems={existingItems}
        onAdd={async (item) => {
          await addTrackerItem.mutateAsync({ item });
        }}
      />

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  );
}
