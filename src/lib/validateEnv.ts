import { z } from "zod";
import { logger } from "./logger";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key required"),
  VITE_TMDB_API_KEY: z.string().optional(),
  VITE_RAWG_API_KEY: z.string().optional(),
  VITE_GOOGLE_BOOKS_API_KEY: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv(): ValidatedEnv {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    const errors = result.error.format();
    logger.error("❌ Environment validation failed:", errors);
    throw new Error(
      "Missing or invalid environment variables. Check console for details."
    );
  }

  // Warn about missing optional API keys (helps with debugging)
  if (!result.data.VITE_TMDB_API_KEY) {
    logger.warn(
      "⚠️ TMDB API key not configured - movie features may be limited"
    );
  }
  if (!result.data.VITE_RAWG_API_KEY) {
    logger.warn(
      "⚠️ RAWG API key not configured - game features may be limited"
    );
  }
  if (!result.data.VITE_GOOGLE_BOOKS_API_KEY) {
    logger.warn(
      "⚠️ Google Books API key not configured - book features may be limited"
    );
  }

  logger.info("✅ Environment variables validated successfully");
  return result.data;
}
