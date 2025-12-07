/**
 * URL Pagination State Adapter
 *
 * Router-aware adapter that synchronizes pagination state with URL query parameters.
 * Use this in route-level components that need shareable/bookmarkable pagination.
 *
 * Example:
 * ```typescript
 * const urlState = useUrlPaginationState();
 * const pagination = usePagination({
 *   items,
 *   initialPage: urlState.page,
 *   initialItemsPerPage: urlState.perPage,
 *   onPageChange: urlState.setPage,
 *   onItemsPerPageChange: urlState.setPerPage,
 * });
 * ```
 */

import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";

interface UrlPaginationState {
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
}

/**
 * React Router adapter for URL-based pagination state
 *
 * Syncs pagination state with URL query params (?page=2&perPage=25)
 * Falls back to defaults if URL params are invalid
 */
export function useUrlPaginationState(
  defaultPage: number = 1,
  defaultPerPage: number = 10
): UrlPaginationState {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);

  // Parse URL params with validation
  const urlPage = parseInt(searchParams.get("page") || "", 10);
  const urlPerPage = parseInt(searchParams.get("perPage") || "", 10);

  const page = urlPage > 0 ? urlPage : defaultPage;
  const perPage = urlPerPage > 0 ? urlPerPage : defaultPerPage;

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setPerPage = useCallback(
    (newPerPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1"); // Reset to page 1 when changing perPage
      params.set("perPage", newPerPage.toString());
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Initialize URL params on mount if they don't exist
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const params = new URLSearchParams(searchParams);
      let needsUpdate = false;

      if (!params.has("page")) {
        params.set("page", page.toString());
        needsUpdate = true;
      }
      if (!params.has("perPage")) {
        params.set("perPage", perPage.toString());
        needsUpdate = true;
      }

      if (needsUpdate) {
        setSearchParams(params, { replace: true });
      }
    }
  }, [page, perPage, searchParams, setSearchParams]);

  return { page, perPage, setPage, setPerPage };
}
