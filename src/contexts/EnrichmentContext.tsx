import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { triggerSteamEnrichment } from "@/services/importService";
import Toast from "@/components/ui/Toast";

const STORAGE_KEY = "npc_enrichment_v1";
const POLL_MS = 15_000;
const MAX_MS = 15 * 60 * 1000; // stop after 15 min regardless
const STABLE_POLLS_TO_COMPLETE = 2; // count unchanged this many times = done

interface StoredState {
  startedAt: number;
  initialCount: number | null;
  lastCount: number | null;
  stablePolls: number;
}

export interface EnrichmentResult {
  /** Games that now have a description, genres, etc. from RAWG. */
  enrichedCount: number;
  /** Games RAWG had no match for — still missing a description. */
  unmatchedCount: number;
}

interface EnrichmentContextValue {
  isRunning: boolean;
  lastResult: EnrichmentResult | null;
  start: () => Promise<void>;
}

const EnrichmentContext = createContext<EnrichmentContextValue>({
  isRunning: false,
  lastResult: null,
  start: async () => {},
});

export function useEnrichment() {
  return useContext(EnrichmentContext);
}

function readStorage(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    // Discard stale state (over 15 min old)
    if (Date.now() - parsed.startedAt > MAX_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

async function countUnenrichedGames(): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .like("external_id", "steam_game_%")
      .is("description", null);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

// Games the enrichment job has already looked up on RAWG but found no match
// for — these will permanently lack a description until the title is fixed
// or RAWG adds the game.
async function countUnmatchedGames(): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .like("external_id", "steam_game_%")
      .is("description", null)
      .not("steam_enrichment_checked_at", "is", null);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

function buildToastMessage(result: EnrichmentResult | null): string {
  if (!result) {
    return "Steam game details have finished loading — check your tracker for updated cover art and descriptions.";
  }

  if (result.unmatchedCount === 0) {
    return result.enrichedCount > 0
      ? `Steam game details finished loading — ${result.enrichedCount} game${result.enrichedCount === 1 ? "" : "s"} updated with cover art and descriptions.`
      : "Steam game details have finished loading — check your tracker for updated cover art and descriptions.";
  }

  if (result.enrichedCount === 0) {
    return `RAWG couldn't find a match for ${result.unmatchedCount} of your Steam games — they're flagged in your tracker so you can fix them up manually.`;
  }

  return `Steam game details finished loading — ${result.enrichedCount} game${result.enrichedCount === 1 ? "" : "s"} updated, but RAWG couldn't find ${result.unmatchedCount} of them (flagged in your tracker).`;
}

export function EnrichmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(() => readStorage() !== null);
  const [lastResult, setLastResult] = useState<EnrichmentResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const complete = useCallback(
    async (initialCount: number | null) => {
      clearStorage();
      stopPolling();

      const unmatchedCount = await countUnmatchedGames();
      if (initialCount !== null && unmatchedCount !== null) {
        setLastResult({
          enrichedCount: Math.max(0, initialCount - unmatchedCount),
          unmatchedCount,
        });
      } else {
        setLastResult(null);
      }

      setIsRunning(false);
      setShowToast(true);

      // Tracker items embed `media` rows directly — refresh the cache so
      // newly-enriched descriptions/genres/images show up without a
      // hard refresh.
      void queryClient.invalidateQueries({ queryKey: queryKeys.tracker.all });
    },
    [queryClient, stopPolling],
  );

  // poll is defined with useRef so it can self-schedule without stale closures
  const pollRef = useRef<() => Promise<void>>(async () => {});
  pollRef.current = async () => {
    const stored = readStorage();
    if (!stored) {
      setIsRunning(false);
      return;
    }

    if (Date.now() - stored.startedAt > MAX_MS) {
      void complete(stored.initialCount);
      return;
    }

    const currentCount = await countUnenrichedGames();

    if (currentCount === null) {
      // transient error — retry
      timerRef.current = setTimeout(() => void pollRef.current(), POLL_MS);
      return;
    }

    if (currentCount === 0) {
      void complete(stored.initialCount);
      return;
    }

    const unchanged = currentCount === stored.lastCount;
    const stablePolls = unchanged ? stored.stablePolls + 1 : 0;

    if (
      stablePolls >= STABLE_POLLS_TO_COMPLETE &&
      Date.now() - stored.startedAt > 30_000
    ) {
      void complete(stored.initialCount);
      return;
    }

    writeStorage({ ...stored, lastCount: currentCount, stablePolls });
    timerRef.current = setTimeout(() => void pollRef.current(), POLL_MS);
  };

  const startPolling = useCallback(() => {
    stopPolling();
    timerRef.current = setTimeout(() => void pollRef.current(), POLL_MS);
  }, [stopPolling]);

  // Resume polling on mount if a previous enrichment was in progress
  useEffect(() => {
    if (readStorage()) {
      setIsRunning(true);
      startPolling();
    }
    return stopPolling;
  }, [startPolling, stopPolling]);

  const start = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLastResult(null);
    const initialCount = await countUnenrichedGames();
    writeStorage({
      startedAt: Date.now(),
      initialCount,
      lastCount: initialCount,
      stablePolls: 0,
    });
    await triggerSteamEnrichment().catch(() => {});
    startPolling();
  }, [isRunning, startPolling]);

  return (
    <EnrichmentContext.Provider value={{ isRunning, lastResult, start }}>
      {children}
      {showToast && (
        <Toast
          message={buildToastMessage(lastResult)}
          onClose={() => setShowToast(false)}
          duration={10000}
        />
      )}
    </EnrichmentContext.Provider>
  );
}
