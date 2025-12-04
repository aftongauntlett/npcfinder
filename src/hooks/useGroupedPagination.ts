import { useState, useMemo, useEffect } from "react";

interface TaskGroup<T> {
  id: string;
  tasks: T[];
  size: number;
}

interface UseGroupedPaginationOptions<T> {
  items: T[];
  groupFn: (items: T[]) => Record<string, T[]>;
  initialItemsPerPage?: number;
}

interface UseGroupedPaginationReturn<T> {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  paginatedGroups: TaskGroup<T>[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setItemsPerPage: (count: number) => void;
}

/**
 * Pagination hook that respects logical groupings
 *
 * Groups are paginated at the group level to prevent fragmenting
 * logical groups (boards, dates) across page boundaries.
 *
 * Algorithm:
 * 1. Group all items first
 * 2. Calculate cumulative task counts per group
 * 3. Find groups that fit within current page's task budget
 * 4. Return complete groups only
 */
export function useGroupedPagination<T>({
  items,
  groupFn,
  initialItemsPerPage = 10,
}: UseGroupedPaginationOptions<T>): UseGroupedPaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  // Group all items first (full list)
  const allGroups = useMemo(() => {
    const grouped = groupFn(items);
    return Object.entries(grouped).map(([id, tasks]) => ({
      id,
      tasks,
      size: tasks.length,
    }));
  }, [items, groupFn]);

  const totalItems = items.length;

  // Calculate which groups fit on current page
  const paginatedGroups = useMemo(() => {
    const startTaskIndex = (currentPage - 1) * itemsPerPage;
    const endTaskIndex = startTaskIndex + itemsPerPage;

    const result: TaskGroup<T>[] = [];
    let cumulativeCount = 0;

    for (const group of allGroups) {
      const groupStartIndex = cumulativeCount;
      const groupEndIndex = cumulativeCount + group.size;

      // Include group if any of its tasks fall within page range
      // AND the group starts before or at the end of page range
      if (groupStartIndex < endTaskIndex && groupEndIndex > startTaskIndex) {
        result.push(group);
      }

      cumulativeCount += group.size;

      // Stop if we've passed the end of the page
      if (cumulativeCount >= endTaskIndex) {
        break;
      }
    }

    return result;
  }, [allGroups, currentPage, itemsPerPage]);

  // Calculate total pages based on task count
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset to page 1 when items change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [totalItems, itemsPerPage]);

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
    totalItems,
    paginatedGroups,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
  };
}
