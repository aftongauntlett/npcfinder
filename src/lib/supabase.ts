import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazily creates and returns the Supabase client.
 * This prevents initialization errors on pages that don't need Supabase.
 *
 * SECURITY NOTE - Database Role Usage:
 * This client uses VITE_SUPABASE_ANON_KEY, which grants the following roles:
 * - 'anon' role: For unauthenticated requests
 * - 'authenticated' role: After successful login (JWT-based)
 *
 * The client NEVER uses privileged roles, which are reserved for:
 * - 'npc_service_role': SECURITY DEFINER functions only (no login capability)
 * - 'postgres': Database administrators via Supabase Dashboard and migrations
 *
 * This separation ensures that even if RLS policies grant access to service roles
 * (e.g., __is_admin_helper_policy__ grants SELECT to npc_service_role),
 * client applications cannot exploit it since they only use anon/authenticated roles.
 */
export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Determine which database to use based on environment
  const isDev = import.meta.env.DEV;
  const hasDevConfig =
    import.meta.env.VITE_SUPABASE_DEV_URL &&
    import.meta.env.VITE_SUPABASE_DEV_ANON_KEY;

  // Debug logging
  console.log("Environment check:", {
    isDev,
    hasDevConfig,
    devUrl: import.meta.env.VITE_SUPABASE_DEV_URL,
    prodUrl: import.meta.env.VITE_SUPABASE_URL,
  });

  let supabaseUrl: string;
  let supabaseKey: string;

  if (isDev && hasDevConfig) {
    // Development mode with dev database configured
    supabaseUrl = import.meta.env.VITE_SUPABASE_DEV_URL;
    supabaseKey = import.meta.env.VITE_SUPABASE_DEV_ANON_KEY;
    console.log("🔧 Using DEVELOPMENT database:", supabaseUrl);
  } else {
    // Production mode or dev mode without dev database configured
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (isDev) {
      console.log("⚠️ Using PRODUCTION database (dev database not configured)");
    }
  }

  // Validate that environment variables are loaded
  if (!supabaseUrl || !supabaseKey) {
    // Check if we're in production
    const isProduction = window.location.hostname !== "localhost";

    if (isProduction) {
      throw new Error(
        "Database connection unavailable. The site administrator needs to configure environment variables on the hosting platform."
      );
    } else {
      throw new Error(
        "Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_DEV_URL and VITE_SUPABASE_DEV_ANON_KEY for development) are set in your .env.local file."
      );
    }
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });
  return supabaseInstance;
};

// Legacy export for backward compatibility
// This will only initialize when actually accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabase();
    return client[prop as keyof SupabaseClient];
  },
});
