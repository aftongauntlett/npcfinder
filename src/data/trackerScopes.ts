export type TrackerScopeId = "movies-tv" | "books" | "games" | "music";

export type TrackerMediaType =
  | "movie"
  | "tv"
  | "book"
  | "game"
  | "song"
  | "album"
  | "playlist";

export type TrackerSearchScope =
  | "all"
  | "movies-tv"
  | "books"
  | "games"
  | "music";

export interface TrackerScopeConfig {
  id: TrackerScopeId;
  label: string;
  navLabel: string;
  path: string;
  pageTitle: string;
  pageDescription: string;
  searchScope: TrackerSearchScope;
  mediaTypes: TrackerMediaType[];
}

export const TRACKER_SCOPES: Record<TrackerScopeId, TrackerScopeConfig> = {
  "movies-tv": {
    id: "movies-tv",
    label: "Movies & TV",
    navLabel: "Movies & TV",
    path: "/app/tracker/movies-tv",
    pageTitle: "Tracker: Movies & TV",
    pageDescription:
      "Track what you are watching with quick status toggles and private notes.",
    searchScope: "movies-tv",
    mediaTypes: ["movie", "tv"],
  },
  books: {
    id: "books",
    label: "Books",
    navLabel: "Books",
    path: "/app/tracker/books",
    pageTitle: "Tracker: Books",
    pageDescription:
      "Track reading progress with private notes while metadata stays API-driven.",
    searchScope: "books",
    mediaTypes: ["book"],
  },
  games: {
    id: "games",
    label: "Games",
    navLabel: "Games",
    path: "/app/tracker/games",
    pageTitle: "Tracker: Games",
    pageDescription:
      "Track what you are playing with one-click watched or move-back actions.",
    searchScope: "games",
    mediaTypes: ["game"],
  },
  music: {
    id: "music",
    label: "Music",
    navLabel: "Music",
    path: "/app/tracker/music",
    pageTitle: "Tracker: Music",
    pageDescription:
      "Track albums and songs with focused notes and simple status control.",
    searchScope: "music",
    mediaTypes: ["song", "album", "playlist"],
  },
};

export const TRACKER_SCOPE_ORDER: TrackerScopeId[] = [
  "movies-tv",
  "books",
  "music",
  "games",
];

export function resolveTrackerScope(rawScope?: string): TrackerScopeId {
  if (rawScope && rawScope in TRACKER_SCOPES) {
    return rawScope as TrackerScopeId;
  }

  return "movies-tv";
}

export function mediaTypeAllowedInScope(
  mediaType: string | undefined,
  scope: TrackerScopeId,
): boolean {
  if (!mediaType) return false;
  return TRACKER_SCOPES[scope].mediaTypes.includes(
    mediaType as TrackerMediaType,
  );
}
