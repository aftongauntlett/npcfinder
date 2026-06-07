// @ts-nocheck
/**
 * Supabase Edge Function: fetch-steam-games
 *
 * Fetches a user's Steam game library using the Steam Web API.
 * Requires a valid Steam ID.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STEAM_API_URL =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1";
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  rtime_last_played?: number;
}

interface SteamResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

// Extract Steam ID from profile URL or return the ID if it's already an ID
function extractSteamId(input: string): string | null {
  input = input.trim();

  // Check if it's a vanilla Steam ID (all digits)
  if (/^\d+$/.test(input)) {
    return input;
  }

  // Check if it's a custom profile URL
  const customUrlMatch = input.match(
    /steamcommunity\.com\/id\/([a-zA-Z0-9_-]+)\/?$/,
  );
  if (customUrlMatch) {
    return customUrlMatch[1];
  }

  // Check if it's a numeric Steam ID URL
  const idUrlMatch = input.match(/steamcommunity\.com\/profiles\/(\d+)\/?$/);
  if (idUrlMatch) {
    return idUrlMatch[1];
  }

  // Treat any remaining alphanumeric string as a bare custom ID
  if (/^[a-zA-Z0-9_-]+$/.test(input)) {
    return input;
  }

  return null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { steamId: rawSteamId } = (await req.json()) as { steamId: string };

    if (!rawSteamId || typeof rawSteamId !== "string") {
      return json({ error: "steamId is required" }, 400);
    }

    if (!STEAM_API_KEY) {
      return json({ error: "Steam API key not configured" }, 500);
    }

    const steamId = extractSteamId(rawSteamId);
    if (!steamId) {
      return json(
        {
          error:
            "Invalid Steam profile URL or ID. Use your Steam profile URL, custom ID, or numeric Steam ID.",
        },
        400,
      );
    }

    let resolvedSteamId = steamId;

    if (!/^\d+$/.test(steamId)) {
      const resolveUrl = `https://steamcommunity.com/id/${steamId}?xml=1`;
      const resolveRes = await fetch(resolveUrl);

      if (!resolveRes.ok) {
        return json(
          {
            error:
              "Steam profile not found or is private. Make sure your profile is public.",
          },
          404,
        );
      }

      const xmlText = await resolveRes.text();
      const idMatch = xmlText.match(/<steamID64>(\d+)<\/steamID64>/);
      if (!idMatch) {
        return json({ error: "Could not resolve Steam ID from profile" }, 400);
      }
      resolvedSteamId = idMatch[1];
    }

    const gamesUrl = new URL(STEAM_API_URL);
    gamesUrl.searchParams.append("key", STEAM_API_KEY);
    gamesUrl.searchParams.append("steamid", resolvedSteamId);
    gamesUrl.searchParams.append("include_appinfo", "1");
    gamesUrl.searchParams.append("include_played_free_games", "1");

    const gamesRes = await fetch(gamesUrl.toString());

    if (!gamesRes.ok) {
      return json(
        {
          error:
            "Failed to fetch Steam library. Make sure your profile is public.",
        },
        400,
      );
    }

    const data: SteamResponse = await gamesRes.json();

    if (!data.response?.games) {
      return json(
        { error: "No games found. Make sure your Steam profile is public." },
        400,
      );
    }

    return json({
      games: data.response.games.map((game) => ({
        appId: game.appid,
        name: game.name,
        hoursPlayed: game.playtime_forever / 60,
        posterUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`,
        lastPlayed:
          game.rtime_last_played && game.rtime_last_played > 0
            ? new Date(game.rtime_last_played * 1000).toISOString()
            : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching Steam games:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
