import { useMemo, useState, useEffect } from "react";
import {
  getPersistedPagination,
  persistPagination,
} from "../utils/persistenceUtils";

export interface UseMediaFilteringOptions<T> {
  items: T[];
  filterFn: (item: T) => boolean;
  sortFn: (a: T, b: T) => number;
  initialPage?: number;
  initialItemsPerPage?: number;
  persistenceKey?: string;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
}

export function useMediaFiltering<T>({
  items,
  filterFn,
  sortFn,
  initialPage = 1,
  initialItemsPerPage = 10,
  persistenceKey,
  onPageChange,
  onItemsPerPageChange,
}: UseMediaFilteringOptions<T>) {
  // Load persisted itemsPerPage if available
  const persistedState = persistenceKey
    ? getPersistedPagination(persistenceKey, initialItemsPerPage)
    : null;

  const [currentPage, setCurrentPage] = useState(initialPage);
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
      onPageChange?.(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const setItemsPerPage = (count: number) => {
    setItemsPerPageState(count);
    setCurrentPage(1); // Reset to page 1 when changing items per page
    onItemsPerPageChange?.(count);
    onPageChange?.(1);
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

    // Pagination controls
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
    setCurrentPage,
  };
}
