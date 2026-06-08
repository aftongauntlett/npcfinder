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

// Edge functions are killed after a wall-clock limit well under what it takes
// to process a large Steam library (each game costs ~1s between RAWG calls
// and rate-limit delays). Stop well before that limit and chain a follow-up
// invocation so the whole backlog gets processed across multiple runs instead
// of silently stalling partway through.
const BATCH_BUDGET_MS = 100_000;

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

  // Only consider games we haven't already looked up — `description IS NULL`
  // alone would re-check titles RAWG already told us it has nothing for, and
  // `steam_enrichment_checked_at IS NULL` alone would re-check titles that
  // already got a description some other way (e.g. resolved at import time).
  const { data: games, error } = await supabase
    .from("media")
    .select("id, title")
    .like("external_id", "steam_game_%")
    .is("description", null)
    .is("steam_enrichment_checked_at", null);

  if (error || !games?.length) {
    console.log("[enrich-steam-games] Nothing to enrich");
    return;
  }

  console.log(`[enrich-steam-games] Enriching up to ${games.length} games this run`);

  const startedAt = Date.now();
  let processed = 0;

  for (const game of games) {
    if (Date.now() - startedAt > BATCH_BUDGET_MS) {
      console.log(
        `[enrich-steam-games] Time budget reached after ${processed} games — chaining a follow-up run for the rest`,
      );
      break;
    }

    // Always stamp `steam_enrichment_checked_at`, even when RAWG has nothing
    // for this title — that's what lets the client tell "hasn't been
    // enriched yet" apart from "RAWG had no match" for games still missing a
    // description.
    const updates = { steam_enrichment_checked_at: new Date().toISOString() };

    try {
      const searchRes = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(game.title)}&page_size=3`,
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const rawgGame =
          searchData.results?.find((r) => titlesMatch(game.title, r.name)) ??
          null;

        if (rawgGame) {
          await delay(200);

          const detailRes = await fetch(
            `https://api.rawg.io/api/games/${rawgGame.id}?key=${RAWG_API_KEY}`,
          );
          const detail = detailRes.ok ? await detailRes.json() : null;

          if (rawgGame.background_image) updates.poster_url = rawgGame.background_image;
          if (detail?.description_raw) updates.description = detail.description_raw;
          if (rawgGame.genres?.length)
            updates.genres = rawgGame.genres.map((g) => g.name).join(", ");
          if (rawgGame.platforms?.length)
            updates.platforms = rawgGame.platforms
              .map((p) => p.platform.name)
              .join(", ");
          if (rawgGame.metacritic) updates.metacritic = rawgGame.metacritic;
          if (rawgGame.released) updates.release_date = rawgGame.released;
          // Don't write `playtime` here — it holds the user's actual Steam
          // hours, not RAWG's average-player stat. Overwriting it would
          // destroy real data the import already captured.
        } else {
          console.log(`[enrich-steam-games] No RAWG match for "${game.title}"`);
        }
      } else {
        console.error(
          `[enrich-steam-games] RAWG search failed (${searchRes.status}) for "${game.title}"`,
        );
      }
    } catch (err) {
      console.error(`[enrich-steam-games] Failed: ${game.title}`, err);
    }

    const { error: updateErr } = await supabase
      .from("media")
      .update(updates)
      .eq("id", game.id);
    if (updateErr) {
      console.error(`[enrich-steam-games] DB update failed: ${game.title}`, updateErr);
    }

    processed += 1;
    await delay(200);
  }

  console.log(`[enrich-steam-games] Batch finished — processed ${processed} games`);

  // See if there's still a backlog (either the time budget cut us off, or
  // more Steam games were imported while this run was in flight). If so,
  // chain another invocation rather than leaving the rest unprocessed —
  // the client's polling already waits for the count to reach zero/stabilize.
  const { count: remaining } = await supabase
    .from("media")
    .select("*", { count: "exact", head: true })
    .like("external_id", "steam_game_%")
    .is("description", null)
    .is("steam_enrichment_checked_at", null);

  if (remaining && remaining > 0) {
    console.log(`[enrich-steam-games] ${remaining} games still unprocessed — chaining follow-up run`);
    EdgeRuntime.waitUntil(
      fetch(`${SUPABASE_URL}/functions/v1/enrich-steam-games`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            console.error(
              `[enrich-steam-games] Follow-up invocation responded ${res.status}`,
            );
          }
        })
        .catch((err) =>
          console.error("[enrich-steam-games] Failed to chain follow-up run", err),
        ),
    );
  } else {
    console.log("[enrich-steam-games] Complete — backlog cleared");
  }
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
