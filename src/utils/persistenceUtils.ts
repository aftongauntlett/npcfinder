/**
 * Persistence utilities for storing and retrieving user preferences
 * Uses localStorage to maintain state across sessions
 */

import { logger } from "@/lib/logger";

interface PaginationState {
  itemsPerPage: number;
}

interface FilterState {
  [key: string]: string | string[] | number | boolean;
}

/**
 * Get persisted pagination state for a specific page/component
 */
export function getPersistedPagination(
  key: string,
  defaultItemsPerPage = 10
): PaginationState {
  try {
    const stored = localStorage.getItem(`pagination:${key}`);
    if (stored) {
      const parsed = JSON.parse(stored) as PaginationState;
      return { itemsPerPage: parsed.itemsPerPage || defaultItemsPerPage };
    }
  } catch (error) {
    logger.error("Failed to load persisted pagination", { error, key });
  }
  return { itemsPerPage: defaultItemsPerPage };
}

/**
 * Persist pagination state for a specific page/component
 */
export function persistPagination(key: string, state: PaginationState): void {
  try {
    localStorage.setItem(`pagination:${key}`, JSON.stringify(state));
  } catch (error) {
    logger.error("Failed to persist pagination", { error, key, state });
  }
}

/**
 * Get persisted filter state for a specific page/component
 */
export function getPersistedFilters<T extends FilterState>(
  key: string,
  defaults: T
): T {
  try {
    const stored = localStorage.getItem(`filters:${key}`);
    if (stored) {
      const parsed = JSON.parse(stored) as T;
      // Merge with defaults to ensure all expected keys exist
      return { ...defaults, ...parsed };
    }
  } catch (error) {
    logger.error("Failed to load persisted filters", { error, key });
  }
  return defaults;
}

/**
 * Persist filter state for a specific page/component
 */
export function persistFilters(key: string, state: FilterState): void {
  try {
    localStorage.setItem(`filters:${key}`, JSON.stringify(state));
  } catch (error) {
    logger.error("Failed to persist filters", { error, key, state });
  }
}

/**
 * Clear persisted state for a specific page/component
 */
export function clearPersistedState(key: string): void {
  try {
    localStorage.removeItem(`pagination:${key}`);
    localStorage.removeItem(`filters:${key}`);
  } catch (error) {
    logger.error("Failed to clear persisted state", { error, key });
  }
}
