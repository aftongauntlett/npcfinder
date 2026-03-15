// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type LaunchMode = "embed" | "new_tab";

interface LaunchRequestBody {
  mode?: LaunchMode;
}

const FALLBACK_GAME_URL = "https://npcfinder-game.vercel.app";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json().catch(() => ({}))) as LaunchRequestBody;
    const mode: LaunchMode = body.mode === "new_tab" ? "new_tab" : "embed";

    const ttlSeconds = Math.max(
      30,
      Number(Deno.env.get("GAME_LAUNCH_TTL_SECONDS") ?? "60"),
    );

    const gameAppUrl =
      Deno.env.get("GAME_APP_URL")?.trim() || FALLBACK_GAME_URL;
    const launchPath =
      Deno.env.get("GAME_LAUNCH_PATH")?.trim() || "/";

    const signingSecret = Deno.env.get("GAME_LAUNCH_SIGNING_SECRET")?.trim();
    if (!signingSecret) {
      return new Response(
        JSON.stringify({
          error:
            "Missing GAME_LAUNCH_SIGNING_SECRET in Edge Function environment",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const issuer = Deno.env.get("GAME_TOKEN_ISSUER")?.trim() || "npc-finder";
    const audience =
      Deno.env.get("GAME_TOKEN_AUDIENCE")?.trim() || "npcfinder-game";

    const { data: profile } = await supabaseClient
      .from("user_profiles")
      .select("display_name, profile_picture_url")
      .eq("user_id", user.id)
      .maybeSingle();

    const header = { alg: "HS256", typ: "JWT" } as const;
    const now = getNumericDate(0);

    const payload = {
      iss: issuer,
      aud: audience,
      sub: user.id,
      iat: now,
      exp: getNumericDate(ttlSeconds),
      jti: crypto.randomUUID(),
      mode,
      display_name: profile?.display_name || user.email || "Player",
      avatar_url: profile?.profile_picture_url || null,
      email: user.email || null,
    };

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(signingSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const launchToken = await create(header, payload, key);

    const launchUrl = new URL(launchPath, gameAppUrl);
    launchUrl.searchParams.set("launch_token", launchToken);

    return new Response(
      JSON.stringify({
        launchUrl: launchUrl.toString(),
        launchToken,
        expiresInSeconds: ttlSeconds,
        mode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
