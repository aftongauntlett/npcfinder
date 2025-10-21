/**
 * Batch media search utility with rate limiting and progress tracking
 */

import { searchMoviesAndTV } from "./mediaSearchAdapters";
import type { MediaItem } from "../components/shared/SendMediaModal";

export interface SearchResult {
  query: string;
  status: "exact" | "fuzzy" | "not_found" | "error";
  movie?: MediaItem;
  alternatives?: MediaItem[];
  error?: string;
}

export interface BatchSearchProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface BatchSearchOptions {
  /** Delay between API calls in milliseconds (default: 300ms for TMDB rate limits) */
  delayMs?: number;
  /** Maximum number of retries per search (default: 2) */
  maxRetries?: number;
  /** Callback for progress updates */
  onProgress?: (progress: BatchSearchProgress) => void;
  /** Callback for individual result completion */
  onResult?: (result: SearchResult) => void;
}

/**
 * Searches for multiple media titles in batch with rate limiting
 */
export async function batchSearchMedia(
  titles: string[],
  options: BatchSearchOptions = {}
): Promise<SearchResult[]> {
  const {
    delayMs = 300, // TMDB allows ~40 requests/10 seconds, so 250-300ms is safe
    maxRetries = 2,
    onProgress,
    onResult,
  } = options;

  const results: SearchResult[] = [];
  const total = titles.length;

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];

    // Update progress
    const progress: BatchSearchProgress = {
      current: i + 1,
      total,
      percentage: Math.round(((i + 1) / total) * 100),
    };
    onProgress?.(progress);

    // Search with retries
    const result = await searchWithRetry(title, maxRetries);
    results.push(result);
    onResult?.(result);

    // Rate limiting: wait before next request (except for last item)
    if (i < titles.length - 1) {
      await delay(delayMs);
    }
  }

  return results;
}

/**
 * Searches for a single title with retry logic
 */
async function searchWithRetry(
  query: string,
  maxRetries: number
): Promise<SearchResult> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const movies = await searchMoviesAndTV(query);

      if (!movies || movies.length === 0) {
        return {
          query,
          status: "not_found",
        };
      }

      // Check for exact match (case-insensitive, ignoring special chars)
      const normalizedQuery = normalizeTitle(query);
      const exactMatch = movies.find(
        (movie: MediaItem) => normalizeTitle(movie.title) === normalizedQuery
      );

      if (exactMatch) {
        return {
          query,
          status: "exact",
          movie: exactMatch,
          alternatives: movies.slice(0, 5), // Keep top 5 for reference
        };
      }

      // Fuzzy match - return top result with alternatives
      return {
        query,
        status: "fuzzy",
        movie: movies[0],
        alternatives: movies.slice(1, 6), // Keep next 5 alternatives
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Check if it's a rate limit error
      if (
        lastError.message.includes("429") ||
        lastError.message.includes("rate limit")
      ) {
        // Exponential backoff for rate limits
        await delay(1000 * Math.pow(2, attempt));
        continue;
      }

      // For other errors, don't retry
      break;
    }
  }

  return {
    query,
    status: "error",
    error: lastError?.message || "Failed to search",
  };
}

/**
 * Normalizes title for comparison
 * Removes special characters, extra spaces, and converts to lowercase
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

/**
 * Utility to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Groups search results by status for easier processing
 */
export function groupSearchResults(results: SearchResult[]): {
  exact: SearchResult[];
  fuzzy: SearchResult[];
  notFound: SearchResult[];
  errors: SearchResult[];
} {
  return {
    exact: results.filter((r) => r.status === "exact"),
    fuzzy: results.filter((r) => r.status === "fuzzy"),
    notFound: results.filter((r) => r.status === "not_found"),
    errors: results.filter((r) => r.status === "error"),
  };
}

/**
 * Generates a summary of batch search results
 */
export function getBatchSearchSummary(results: SearchResult[]): {
  total: number;
  exact: number;
  fuzzy: number;
  notFound: number;
  errors: number;
  successRate: number;
} {
  const grouped = groupSearchResults(results);
  const total = results.length;
  const successful = grouped.exact.length + grouped.fuzzy.length;

  return {
    total,
    exact: grouped.exact.length,
    fuzzy: grouped.fuzzy.length,
    notFound: grouped.notFound.length,
    errors: grouped.errors.length,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
  };
}
