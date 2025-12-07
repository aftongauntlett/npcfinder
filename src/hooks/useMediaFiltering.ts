import { useMemo, useState, useEffect } from "react";
import {
  getPersistedPagination,
  persistPagination,
} from "../utils/persistenceUtils";

export interface UseMediaFilteringOptions<T> {
  items: T[];
  filterFn: (item: T) => boolean;
  sortFn: (a: T, b: T) => number;
  initialItemsPerPage?: number;
  persistenceKey?: string;
}

export function useMediaFiltering<T>({
  items,
  filterFn,
  sortFn,
  initialItemsPerPage = 10,
  persistenceKey,
}: UseMediaFilteringOptions<T>) {
  // Load persisted itemsPerPage if available
  const persistedState = persistenceKey
    ? getPersistedPagination(persistenceKey, initialItemsPerPage)
    : null;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(
    persistedState?.itemsPerPage || initialItemsPerPage
  );

  // Persist itemsPerPage changes
  useEffect(() => {
    if (persistenceKey) {
      persistPagination(persistenceKey, { itemsPerPage });
    }
  }, [itemsPerPage, persistenceKey]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    return items.filter(filterFn).sort(sortFn);
  }, [items, filterFn, sortFn]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterFn, sortFn]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  const setItemsPerPage = (count: number) => {
    setItemsPerPageState(count);
  };

  return {
    // Filtered and paginated results
    items: paginatedItems,
    totalItems: filteredAndSortedItems.length,
    allFilteredItems: filteredAndSortedItems,

    // Pagination state
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, filteredAndSortedItems.length),

    // Pagination controls
    setCurrentPage: goToPage,
    setItemsPerPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
