// @ts-nocheck
/**
 * Supabase Edge Function: keep-alive
 *
 * Prevents the Supabase project from pausing due to inactivity (free tier pauses after 7 days).
 * Called on a schedule via Upstash QStash every 3 days.
 *
 * Required secrets (set via `supabase secrets set`):
 * - SUPABASE_URL        (auto-provided in edge functions)
 * - SUPABASE_SERVICE_ROLE_KEY  (use service role to bypass RLS for the health check)
 * - KEEP_ALIVE_SECRET   (shared secret to prevent unauthorized calls)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  // Only allow POST (QStash always sends POST)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify the shared secret so this endpoint isn't publicly abusable.
  // QStash will include this as a bearer token in the Authorization header.
  const keepAliveSecret = Deno.env.get("KEEP_ALIVE_SECRET");
  if (!keepAliveSecret) {
    return new Response("Unauthorized", { status: 401 });
  }
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== keepAliveSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase env vars" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Run a lightweight query — just enough to register activity and prevent pausing.
  // Querying pg_stat_activity via a raw SQL RPC isn't available by default, so
  // we ping the REST API health endpoint which is always available and registers activity.
  const healthUrl = `${supabaseUrl}/rest/v1/`;
  const healthRes = await fetch(healthUrl, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  const timestamp = new Date().toISOString();
  const status = healthRes.status;

  console.log(`[keep-alive] ping at ${timestamp} — REST status ${status}`);

  // Also run a trivial DB round-trip using the supabase client.
  // Selecting from auth.users (exposed as 'users' on the auth schema) via service role
  // always works regardless of public schema tables.
  await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

  return new Response(
    JSON.stringify({ ok: true, pinged_at: timestamp, rest_status: status }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
