import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { triggerSteamEnrichment } from "@/services/importService";
import Toast from "@/components/ui/Toast";

const STORAGE_KEY = "npc_enrichment_v1";
const POLL_MS = 15_000;
const MAX_MS = 15 * 60 * 1000; // stop after 15 min regardless
const STABLE_POLLS_TO_COMPLETE = 2; // count unchanged this many times = done

interface StoredState {
  startedAt: number;
  lastCount: number | null;
  stablePolls: number;
}

interface EnrichmentContextValue {
  isRunning: boolean;
  start: () => Promise<void>;
}

const EnrichmentContext = createContext<EnrichmentContextValue>({
  isRunning: false,
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

export function EnrichmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isRunning, setIsRunning] = useState(() => readStorage() !== null);
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const complete = useCallback(() => {
    clearStorage();
    setIsRunning(false);
    setShowToast(true);
    stopPolling();
  }, [stopPolling]);

  // poll is defined with useRef so it can self-schedule without stale closures
  const pollRef = useRef<() => Promise<void>>(async () => {});
  pollRef.current = async () => {
    const stored = readStorage();
    if (!stored) {
      setIsRunning(false);
      return;
    }

    if (Date.now() - stored.startedAt > MAX_MS) {
      complete();
      return;
    }

    const currentCount = await countUnenrichedGames();

    if (currentCount === null) {
      // transient error — retry
      timerRef.current = setTimeout(() => void pollRef.current(), POLL_MS);
      return;
    }

    if (currentCount === 0) {
      complete();
      return;
    }

    const unchanged = currentCount === stored.lastCount;
    const stablePolls = unchanged ? stored.stablePolls + 1 : 0;

    if (
      stablePolls >= STABLE_POLLS_TO_COMPLETE &&
      Date.now() - stored.startedAt > 30_000
    ) {
      complete();
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
    const initialCount = await countUnenrichedGames();
    writeStorage({ startedAt: Date.now(), lastCount: initialCount, stablePolls: 0 });
    await triggerSteamEnrichment().catch(() => {});
    startPolling();
  }, [isRunning, startPolling]);

  return (
    <EnrichmentContext.Provider value={{ isRunning, start }}>
      {children}
      {showToast && (
        <Toast
          message="Steam game details have finished loading — check your tracker for updated cover art and descriptions."
          onClose={() => setShowToast(false)}
          duration={8000}
        />
      )}
    </EnrichmentContext.Provider>
  );
}
