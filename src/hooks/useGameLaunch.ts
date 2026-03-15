import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

type LaunchMode = "embed" | "new_tab";

interface GameLaunchResponse {
  launchUrl: string;
  launchToken: string;
  expiresInSeconds: number;
  mode: LaunchMode;
}

interface UseGameLaunchReturn {
  getLaunchUrl: (mode: LaunchMode) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

const FALLBACK_GAME_URL = "https://npcfinder-game.vercel.app";

export const useGameLaunch = (): UseGameLaunchReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackUrl =
    import.meta.env.VITE_GAME_APP_URL?.trim() || FALLBACK_GAME_URL;

  const getLaunchUrl = useCallback(
    async (mode: LaunchMode): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: invokeError } =
          await supabase.functions.invoke<GameLaunchResponse>("game-launch", {
            body: { mode },
          });

        if (invokeError) {
          throw new Error(
            invokeError.message || "Failed to create game launch",
          );
        }

        if (!data?.launchUrl) {
          throw new Error("Game launch URL not returned");
        }

        return data.launchUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create game launch";
        setError(message);
        return fallbackUrl;
      } finally {
        setLoading(false);
      }
    },
    [fallbackUrl],
  );

  return {
    getLaunchUrl,
    loading,
    error,
  };
};
