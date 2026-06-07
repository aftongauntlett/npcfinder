import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Book,
  CheckCircle2,
  ChevronRight,
  Film,
  Gamepad2,
  Loader2,
  Music2,
  Upload,
  X,
} from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import ContentLayout from "@/components/layouts/ContentLayout";
import { Button, Card } from "@/components/shared";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  checkForDuplicates,
  importItems,
  parseImportFile,
  fetchSteamGames,
  type ImportedItem,
  type ImportResult,
  type ImportSource,
} from "@/services/importService";
import { useEnrichment } from "@/contexts/EnrichmentContext";
import { TRACKER_SCOPES } from "@/data/trackerScopes";

const PAGE_META = {
  title: "Import Library",
  description: "Bring your existing data into NPC Finder",
  noIndex: true,
};

// --- Source definitions ---

interface SourceDef {
  id: ImportSource;
  name: string;
  category: "books" | "movies-tv" | "music" | "games";
  fileType: "csv" | "json" | "steam";
  accept: string;
  description: string;
  instructions: string[];
  noteAfterUpload?: string;
}

const SOURCES: SourceDef[] = [
  {
    id: "goodreads",
    name: "Goodreads",
    category: "books",
    fileType: "csv",
    accept: ".csv",
    description: "Import your read, reading, and want-to-read books",
    instructions: [
      "Go to goodreads.com and sign in to your account.",
      'Click your profile picture in the top-right, then choose "My Books".',
      'On the left sidebar, scroll down and click "Import and export".',
      'Click the "Export Library" button. A CSV file will download to your computer.',
      "Come back here and upload that file.",
    ],
    noteAfterUpload:
      "Ratings (1–5 stars) are imported. Books marked as Read are set to Done; Currently Reading to In Progress; Want to Read to Want To.",
  },
  {
    id: "letterboxd",
    name: "Letterboxd",
    category: "movies-tv",
    fileType: "csv",
    accept: ".csv",
    description: "Import your watched films, diary, ratings, or watchlist",
    instructions: [
      "Go to letterboxd.com and sign in.",
      'Click your username in the top-right and choose "Settings".',
      'Click "Import & Export" in the left menu.',
      'Under "Export Your Data", click "Export your data". A ZIP file will download.',
      "Open the ZIP file on your computer (double-click it). Inside, find diary.csv (your watched history), ratings.csv (your rated films), or watchlist.csv.",
      "Upload whichever CSV file you want to import.",
    ],
    noteAfterUpload:
      "Diary and ratings entries are imported as Done. Watchlist entries are imported as Want To. Half-star ratings are converted to the 1–10 scale.",
  },
  {
    id: "imdb",
    name: "IMDb",
    category: "movies-tv",
    fileType: "csv",
    accept: ".csv",
    description: "Import your IMDb ratings for movies and TV shows",
    instructions: [
      "Go to imdb.com and sign in.",
      'Click your account name in the top-right, then choose "Your ratings".',
      "On the Your Ratings page, click the three-dot menu (⋯) near the top-right of the list.",
      'Choose "Export" from the dropdown. A CSV file will download.',
      "Come back here and upload that file.",
    ],
    noteAfterUpload:
      "All rated titles are imported as Done. IMDb ratings (1–10) are carried over directly. TV series are automatically separated from movies.",
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "music",
    fileType: "json",
    accept: ".json",
    description: "Import your saved songs and albums from your Spotify library",
    instructions: [
      "Go to spotify.com and sign in to your account.",
      'Click your profile picture (top-right) and choose "Account".',
      'Scroll down to "Privacy settings" and click it.',
      'Scroll to "Download your data" and click "Request data". Spotify will prepare your data — this usually takes a few minutes.',
      "You will get an email when it is ready. Download the ZIP file from that email.",
      "Open the ZIP file. Find the file named YourLibrary.json and upload it here.",
    ],
    noteAfterUpload:
      "Saved tracks are imported as songs (Want To). Saved albums are imported as albums (Want To). Playlists are not included.",
  },
  {
    id: "steam",
    name: "Steam",
    category: "games",
    fileType: "steam",
    accept: "",
    description: "Import your Steam game library",
    instructions: [
      "Make sure your Steam profile is public. Go to steamcommunity.com/id/[yourname] or your numeric Steam ID.",
      'Go to your profile and click "Edit Profile".',
      'Under "Profile Visibility", select "Public" and save.',
      "Come back here and paste your Steam profile URL or custom ID.",
    ],
    noteAfterUpload:
      "Games with any recorded playtime are imported as Done. Games with zero hours are imported as Want To.",
  },
];

const CATEGORY_META = {
  books: {
    label: "Books",
    icon: Book,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  "movies-tv": {
    label: "Movies & TV",
    icon: Film,
    color: "text-blue-600 dark:text-blue-400",
  },
  music: {
    label: "Music",
    icon: Music2,
    color: "text-purple-600 dark:text-purple-400",
  },
  games: {
    label: "Games",
    icon: Gamepad2,
    color: "text-orange-600 dark:text-orange-400",
  },
};

const CATEGORY_ORDER: Array<SourceDef["category"]> = [
  "books",
  "movies-tv",
  "music",
  "games",
];

type PageState =
  | { phase: "select" }
  | { phase: "configure"; source: SourceDef }
  | { phase: "checking"; source: SourceDef }
  | {
      phase: "preview";
      source: SourceDef;
      newItems: ImportedItem[];
      skippedCount: number;
    }
  | {
      phase: "importing";
      source: SourceDef;
      items: ImportedItem[];
      done: number;
    }
  | { phase: "done"; source: SourceDef; result: ImportResult };

// --- Sub-components ---

function StatusBadge({ status }: { status: ImportedItem["status"] }) {
  const map = {
    done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    in_progress:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    want_to: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };
  const label = {
    done: "Done",
    in_progress: "In Progress",
    want_to: "Want To",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}

function DropZone({
  accept,
  fileType,
  onFile,
  fileName,
  onClear,
}: {
  accept: string;
  fileType: "csv" | "json";
  onFile: (text: string, name: string) => void;
  fileName: string | null;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFile(text, file.name);
      };
      reader.readAsText(file);
    },
    [onFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  if (fileName) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/40 bg-primary/5">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
          {fileName}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 px-6 py-10 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
        dragging
          ? "border-primary bg-primary/10"
          : "border-gray-300 dark:border-gray-600 hover:border-primary/60 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      aria-label={`Upload ${fileType.toUpperCase()} file`}
    >
      <Upload className="w-6 h-6 text-gray-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Drop your {fileType.toUpperCase()} here, or{" "}
          <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {fileType === "csv" ? "CSV files only" : "JSON files only"}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
        }}
      />
    </div>
  );
}

function SteamInputZone({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (steamId: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="paste your Steam profile URL or custom ID"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Fetching games…
            </>
          ) : (
            "Fetch your library"
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Examples: steamcommunity.com/id/yourname,
        steamcommunity.com/profiles/12345678
      </p>
    </form>
  );
}

// --- Main page ---

export default function ImportPage() {
  usePageMeta(PAGE_META);
  const navigate = useNavigate();

  const enrichment = useEnrichment();
  const [pageState, setPageState] = useState<PageState>({ phase: "select" });
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    meta: CATEGORY_META[cat],
    sources: SOURCES.filter((s) => s.category === cat),
  }));

  const handleSourceSelect = (source: SourceDef) => {
    setFileName(null);
    setParseError(null);
    setPageState({ phase: "configure", source });
  };

  const handleBack = () => {
    if (
      pageState.phase === "configure" ||
      pageState.phase === "checking" ||
      pageState.phase === "done"
    ) {
      setPageState({ phase: "select" });
      setFileName(null);
      setParseError(null);
    } else if (pageState.phase === "preview") {
      setPageState({ phase: "configure", source: pageState.source });
      setFileName(null);
      setParseError(null);
    }
  };

  const handleFile = useCallback(
    (text: string, name: string, source: SourceDef) => {
      setParseError(null);
      setFileName(name);

      let parsed: ImportedItem[] = [];
      try {
        parsed = parseImportFile(source.id, text);
      } catch {
        setParseError(
          "Could not read that file. Make sure you uploaded the correct file for this source.",
        );
        return;
      }

      if (parsed.length === 0) {
        setParseError(
          "No items were found in that file. Double-check that you exported from the right section and uploaded the correct file.",
        );
        return;
      }

      setPageState({ phase: "checking", source });

      void checkForDuplicates(parsed).then(({ newItems, alreadyTracked }) => {
        setPageState({
          phase: "preview",
          source,
          newItems,
          skippedCount: alreadyTracked.length,
        });
      });
    },
    [],
  );

  const handleSteamSubmit = useCallback(
    async (steamId: string, source: SourceDef) => {
      setSteamError(null);
      setSteamLoading(true);

      try {
        const parsed = await fetchSteamGames(steamId);

        if (parsed.length === 0) {
          setSteamError("No games found in your library.");
          setSteamLoading(false);
          return;
        }

        setPageState({ phase: "checking", source });
        setSteamLoading(false);

        const { newItems, alreadyTracked } = await checkForDuplicates(parsed);
        setPageState({
          phase: "preview",
          source,
          newItems,
          skippedCount: alreadyTracked.length,
        });
      } catch (error) {
        setSteamError(
          error instanceof Error
            ? error.message
            : "Failed to fetch your Steam library. Make sure your profile is public.",
        );
        setSteamLoading(false);
      }
    },
    [],
  );

  const handleImport = async (source: SourceDef, items: ImportedItem[]) => {
    if (items.length === 0) return;
    setPageState({ phase: "importing", source, items, done: 0 });

    const result = await importItems(items, (done) => {
      setPageState({ phase: "importing", source, items, done });
    });

    if (source.id === "steam") {
      void enrichment.start();
    }

    setPageState({ phase: "done", source, result });
  };

  // --- Render phases ---

  if (pageState.phase === "select") {
    return (
      <MainLayout>
        <ContentLayout
          title="Import Your Library"
          description="Bring your existing data into NPC Finder from the platforms you already use."
        >
          <div className="space-y-8 max-w-3xl">
            {grouped.map(({ category, meta, sources }) => {
              const Icon = meta.icon;
              return (
                <div key={category}>
                  <div className={`flex items-center gap-2 mb-3 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide">
                      {meta.label}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {sources.map((source) => (
                      <Card
                        key={source.id}
                        hover="lift"
                        border
                        spacing="sm"
                        clickable
                        onClick={() => handleSourceSelect(source)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3 px-1 py-1">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {source.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {source.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ContentLayout>
      </MainLayout>
    );
  }

  if (pageState.phase === "configure") {
    const { source } = pageState;
    return (
      <MainLayout>
        <ContentLayout
          title={`Import from ${source.name}`}
          description={source.description}
        >
          <div className="max-w-2xl space-y-6">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All sources
            </button>

            {/* Step-by-step instructions */}
            <Card border spacing="md">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                How to import from {source.name}
              </h3>
              <ol className="space-y-3">
                {source.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Upload or input section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {source.fileType === "steam"
                  ? "Enter your Steam profile"
                  : "Upload your file"}
              </h3>
              {source.fileType === "steam" ? (
                <>
                  <SteamInputZone
                    onSubmit={(steamId) =>
                      void handleSteamSubmit(steamId, source)
                    }
                    isLoading={steamLoading}
                    error={steamError}
                  />
                  <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Already imported your Steam library?
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fetches descriptions, genres, cover art, and ratings from
                      RAWG for any Steam games currently missing that data. Runs
                      in the background — you can navigate away once it starts.
                    </p>
                    {enrichment.isRunning ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
                        Running in the background — you'll get a notification
                        when it's done.
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => void enrichment.start()}
                      >
                        Refresh game details from RAWG
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <DropZone
                    accept={source.accept}
                    fileType={source.fileType as "csv" | "json"}
                    fileName={fileName}
                    onClear={() => {
                      setFileName(null);
                      setParseError(null);
                    }}
                    onFile={(text, name) => handleFile(text, name, source)}
                  />

                  {parseError && (
                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ContentLayout>
      </MainLayout>
    );
  }

  if (pageState.phase === "checking") {
    return (
      <MainLayout>
        <ContentLayout
          title="Checking your library…"
          description="Looking for items you've already added."
        >
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Comparing with your existing tracker…
          </div>
        </ContentLayout>
      </MainLayout>
    );
  }

  if (pageState.phase === "preview") {
    const { source, newItems, skippedCount } = pageState;
    const items = newItems;

    const statusCounts = items.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const ratedCount = items.filter((i) => i.rating !== null).length;
    const totalFound = items.length + skippedCount;
    const PREVIEW_LIMIT = 15;

    return (
      <MainLayout>
        <ContentLayout
          title={`Preview — ${source.name} Import`}
          description={
            skippedCount > 0
              ? `${totalFound.toLocaleString()} items found — ${items.length.toLocaleString()} new, ${skippedCount.toLocaleString()} already in your library`
              : `${items.length.toLocaleString()} new item${items.length === 1 ? "" : "s"} ready to import`
          }
        >
          <div className="max-w-2xl space-y-6">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {/* Summary */}
            <Card border spacing="md">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {items.length.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    To import
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(statusCounts["done"] ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Done
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(statusCounts["want_to"] ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Want To
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {ratedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    With rating
                  </p>
                </div>
              </div>

              {skippedCount > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {skippedCount.toLocaleString()} item
                  {skippedCount === 1 ? "" : "s"} already in your library — will
                  be skipped
                </div>
              )}

              {source.noteAfterUpload && (
                <p
                  className={`text-xs text-gray-500 dark:text-gray-400 ${skippedCount > 0 ? "mt-2" : "mt-4 border-t border-gray-200 dark:border-gray-700 pt-3"}`}
                >
                  {source.noteAfterUpload}
                </p>
              )}
            </Card>

            {/* Item list preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Preview ({Math.min(items.length, PREVIEW_LIMIT)} of{" "}
                {items.length.toLocaleString()})
              </h3>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
                {items.slice(0, PREVIEW_LIMIT).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {item.mediaItem.title}
                      </p>
                      {(item.mediaItem.authors || item.mediaItem.artist) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.mediaItem.authors ?? item.mediaItem.artist}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.rating !== null && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ★ {item.rating}/10
                        </span>
                      )}
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
                {items.length > PREVIEW_LIMIT && (
                  <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      + {(items.length - PREVIEW_LIMIT).toLocaleString()} more
                      items
                    </p>
                  </div>
                )}
              </div>
            </div>

            {items.length > 0 ? (
              <Button
                onClick={() => void handleImport(source, items)}
                className="w-full sm:w-auto"
              >
                Import {items.length.toLocaleString()} new item
                {items.length === 1 ? "" : "s"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Everything in this file is already in your library — nothing
                  to import!
                </div>
                {source.id === "steam" && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Want to refresh game details?
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fetches descriptions, genres, cover art, and ratings from
                      RAWG for any Steam games currently missing that data.
                      Runs in the background — you can navigate away once it
                      starts.
                    </p>
                    {enrichment.isRunning ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
                        Running in the background — you'll get a notification
                        when it's done.
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => void enrichment.start()}
                      >
                        Refresh game details from RAWG
                      </Button>
                    )}
                  </div>
                )}
                <Button variant="secondary" onClick={handleBack}>
                  Go back
                </Button>
              </div>
            )}
          </div>
        </ContentLayout>
      </MainLayout>
    );
  }

  if (pageState.phase === "importing") {
    const { items, done } = pageState;
    const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

    return (
      <MainLayout>
        <ContentLayout
          title="Importing…"
          description="Please keep this page open."
        >
          <div className="max-w-md space-y-6">
            <Card border spacing="md">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {done.toLocaleString()} / {items.length.toLocaleString()}{" "}
                    items processed
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This may take a minute for large libraries. Don't close this
                  tab.
                </p>
              </div>
            </Card>
          </div>
        </ContentLayout>
      </MainLayout>
    );
  }

  // phase === "done"
  const { source, result } = pageState;
  const hasErrors = result.errors.length > 0;

  return (
    <MainLayout>
      <ContentLayout
        title="Import Complete"
        description={`Finished importing from ${source.name}`}
      >
        <div className="max-w-md space-y-6">
          <Card border spacing="md">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {result.imported.toLocaleString()} item
                  {result.imported === 1 ? "" : "s"} imported
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/40 px-3 py-2">
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    {result.imported.toLocaleString()}
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    Imported
                  </p>
                </div>
                {result.failed > 0 && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2">
                    <p className="font-semibold text-red-700 dark:text-red-300">
                      {result.failed.toLocaleString()}
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-xs">
                      Failed
                    </p>
                  </div>
                )}
              </div>

              {source.id === "steam" && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin text-primary" />
                  <span>
                    Descriptions, genres, and images are loading from RAWG in
                    the background — this takes a few minutes for large
                    libraries. You can navigate away now.
                  </span>
                </div>
              )}

              {hasErrors && (
                <details className="text-xs text-gray-500 dark:text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                    Show errors ({result.errors.length})
                  </summary>
                  <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li
                        key={i}
                        className="truncate text-red-500 dark:text-red-400"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                void navigate(
                  source.id === "steam"
                    ? TRACKER_SCOPES.games.path
                    : TRACKER_SCOPES.movies.path,
                )
              }
            >
              Go to Tracker
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFileName(null);
                setParseError(null);
                setPageState({ phase: "select" });
              }}
            >
              Import another source
            </Button>
          </div>
        </div>
      </ContentLayout>
    </MainLayout>
  );
}
