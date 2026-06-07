// @ts-nocheck
/**
 * Supabase Edge Function: enrich-steam-games
 *
 * Fetches descriptions, genres, platforms, and images from RAWG for all
 * Steam-imported games that have no description yet. Runs in the background
 * via EdgeRuntime.waitUntil so the caller gets an immediate response and can
 * navigate away — the server keeps working until every game is processed.
 *
 * Required secret: RAWG_API_KEY (set via `supabase secrets set RAWG_API_KEY=...`)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAWG_API_KEY = Deno.env.get("RAWG_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function titlesMatch(a, b) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

async function runEnrichment() {
  if (!RAWG_API_KEY) {
    console.error("[enrich-steam-games] RAWG_API_KEY secret not set");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: games, error } = await supabase
    .from("media")
    .select("id, title")
    .like("external_id", "steam_game_%")
    .is("description", null);

  if (error || !games?.length) {
    console.log("[enrich-steam-games] Nothing to enrich");
    return;
  }

  console.log(`[enrich-steam-games] Enriching ${games.length} games`);

  for (const game of games) {
    try {
      const searchRes = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(game.title)}&page_size=3`,
      );
      if (!searchRes.ok) {
        await delay(400);
        continue;
      }

      const searchData = await searchRes.json();
      const rawgGame =
        searchData.results?.find((r) => titlesMatch(game.title, r.name)) ??
        null;

      if (!rawgGame) {
        await delay(200);
        continue;
      }

      await delay(200);

      const detailRes = await fetch(
        `https://api.rawg.io/api/games/${rawgGame.id}?key=${RAWG_API_KEY}`,
      );
      const detail = detailRes.ok ? await detailRes.json() : null;

      const updates = {};
      if (rawgGame.background_image) updates.poster_url = rawgGame.background_image;
      if (detail?.description_raw) updates.description = detail.description_raw;
      if (rawgGame.genres?.length)
        updates.genres = rawgGame.genres.map((g) => g.name).join(", ");
      if (rawgGame.platforms?.length)
        updates.platforms = rawgGame.platforms
          .map((p) => p.platform.name)
          .join(", ");
      if (rawgGame.metacritic) updates.metacritic = rawgGame.metacritic;
      if (rawgGame.playtime) updates.playtime = rawgGame.playtime;
      if (rawgGame.released) updates.release_date = rawgGame.released;

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from("media")
          .update(updates)
          .eq("id", game.id);
        if (updateErr) {
          console.error(`[enrich-steam-games] DB update failed: ${game.title}`, updateErr);
        }
      }
    } catch (err) {
      console.error(`[enrich-steam-games] Failed: ${game.title}`, err);
    }

    await delay(200);
  }

  console.log("[enrich-steam-games] Complete");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Return immediately — EdgeRuntime.waitUntil keeps the function alive on the
  // server until runEnrichment resolves, even after the client navigates away.
  EdgeRuntime.waitUntil(runEnrichment());

  return json({ started: true });
});
