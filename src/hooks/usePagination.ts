import { useState, useMemo, useEffect } from "react";
import {
  getPersistedPagination,
  persistPagination,
} from "../utils/persistenceUtils";

interface UsePaginationOptions<T> {
  items: T[];
  initialPage?: number;
  initialItemsPerPage?: number;
  filterFn?: (item: T) => boolean;
  sortFn?: (a: T, b: T) => number;
  persistenceKey?: string;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  paginatedItems: T[];
  filteredItems: T[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setItemsPerPage: (count: number) => void;
}

export function usePagination<T>({
  items,
  initialPage = 1,
  initialItemsPerPage = 10,
  filterFn,
  sortFn,
  persistenceKey,
  onPageChange,
  onItemsPerPageChange,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
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

  // Apply filter and sort
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterFn) {
      result = result.filter(filterFn);
    }

    if (sortFn) {
      result.sort(sortFn);
    }

    return result;
  }, [items, filterFn, sortFn]);

  // Calculate total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage)
  );

  // Reset to page 1 when filters change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredItems.length, itemsPerPage]);

  // Get paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Navigation helpers
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    onPageChange?.(validPage);
  };

  const nextPage = () => {
    if (hasNextPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
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
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    filteredItems,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
  };
}
