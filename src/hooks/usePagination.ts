import { useState, useMemo, useEffect } from "react";

interface UsePaginationOptions<T> {
  items: T[];
  initialItemsPerPage?: number;
  filterFn?: (item: T) => boolean;
  sortFn?: (a: T, b: T) => number;
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
  initialItemsPerPage = 10,
  filterFn,
  sortFn,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

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
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const setItemsPerPage = (count: number) => {
    setItemsPerPageState(count);
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
