import { searchBooks } from "./bookSearchAdapters";
import type { MediaItem } from "../components/shared/SendMediaModal";

export interface BatchSearchProgress {
  current: number;
  total: number;
  percentage: number;
}

export type SearchStatus = "exact" | "fuzzy" | "not_found" | "error";

export interface SearchResult {
  query: string;
  book: MediaItem | null;
  status: SearchStatus;
  error?: string;
  confidence?: number;
}

interface BatchSearchOptions {
  onProgress?: (progress: BatchSearchProgress) => void;
  delayMs?: number;
}

export interface BatchSearchSummary {
  total: number;
  exact: number;
  fuzzy: number;
  notFound: number;
  errors: number;
}

/**
 * Batch search books from Google Books API
 */
export async function batchSearchBooks(
  queries: string[],
  options: BatchSearchOptions = {}
): Promise<SearchResult[]> {
  const { onProgress, delayMs = 300 } = options;
  const results: SearchResult[] = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    // Report progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: queries.length,
        percentage: Math.round(((i + 1) / queries.length) * 100),
      });
    }

    try {
      const searchResults = await searchBooks(query);

      if (searchResults.length === 0) {
        results.push({
          query,
          book: null,
          status: "not_found",
        });
      } else {
        const firstResult = searchResults[0];
        const normalizedQuery = query.toLowerCase().trim();
        const normalizedTitle = firstResult.title.toLowerCase().trim();

        // Determine match quality
        const isExactMatch =
          normalizedTitle === normalizedQuery ||
          normalizedTitle.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedTitle);

        results.push({
          query,
          book: firstResult,
          status: isExactMatch ? "exact" : "fuzzy",
          confidence: isExactMatch ? 1.0 : 0.7,
        });
      }
    } catch (error) {
      results.push({
        query,
        book: null,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Rate limiting delay
    if (i < queries.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Get summary statistics from search results
 */
export function getBatchSearchSummary(
  results: SearchResult[]
): BatchSearchSummary {
  return {
    total: results.length,
    exact: results.filter((r) => r.status === "exact").length,
    fuzzy: results.filter((r) => r.status === "fuzzy").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    errors: results.filter((r) => r.status === "error").length,
  };
}
