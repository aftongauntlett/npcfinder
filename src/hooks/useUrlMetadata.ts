/**
 * useUrlMetadata Hook
 *
 * Fetches metadata from a URL using the Supabase Edge Function
 */

import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * URL Metadata Contract
 *
 * This interface defines what the scrape-url edge function returns for different URL types:
 *
 * - **Generic pages** (`kind: "generic"`): Always includes `url` and attempts to extract
 *   `title` and `description`. May include `image`, `author`, and `date` when available.
 *
 * - **Job postings** (`kind: "job"`): Guaranteed to have `jobPosting` with at least
 *   `company` and `position` populated. May include `salary`, `location`, and `employmentType`.
 *
 * - **Recipes** (`kind: "recipe"`): Guaranteed to have `recipe` with at least `name` populated.
 *   May include `ingredients`, `instructions`, prep/cook times, and servings.
 *
 * The `kind` discriminant allows consumers to safely branch on the metadata type
 * and know which fields are meaningful.
 */
export interface UrlMetadata {
  kind: "generic" | "job" | "recipe";
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  author?: string;
  date?: string;
  jobPosting?: {
    company?: string;
    position?: string;
    salary?: string;
    location?: string;
    employmentType?: string;
    description?: string;
  };
  recipe?: {
    name?: string;
    description?: string;
    ingredients?: string[];
    instructions?: string[];
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    servings?: string;
    category?: string;
  };
}

interface UseUrlMetadataReturn {
  fetchMetadata: (url: string) => Promise<UrlMetadata | null>;
  loading: boolean;
  error: string | null;
  data: UrlMetadata | null;
}

export const useUrlMetadata = (): UseUrlMetadataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UrlMetadata | null>(null);

  const fetchMetadata = useCallback(
    async (url: string): Promise<UrlMetadata | null> => {
      if (!url || !url.trim()) {
        setError("URL is required");
        return null;
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        setError("Invalid URL format");
        return null;
      }

      setLoading(true);
      setError(null);
      setData(null);

      try {
        const { data: functionData, error: functionError } =
          await supabase.functions.invoke("scrape-url", {
            body: { url },
          });

        if (functionError) {
          throw new Error(functionError.message || "Failed to fetch metadata");
        }

        if (functionData?.error) {
          throw new Error(functionData.error);
        }

        setData(functionData as UrlMetadata);
        return functionData as UrlMetadata;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch metadata";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    fetchMetadata,
    loading,
    error,
    data,
  };
};
