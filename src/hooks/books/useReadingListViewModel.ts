import { useState, useMemo, useCallback, useEffect } from "react";
import type { ReadingListItem } from "../../services/booksService.types";
import type { MediaItem } from "@/components/shared";
import {
  useReadingList,
  useAddToReadingList,
  useToggleReadingListRead,
  useDeleteFromReadingList,
} from "../useReadingListQueries";
import { useMediaFiltering } from "../useMediaFiltering";
import { useUrlPaginationState } from "../useUrlPaginationState";
import {
  getPersistedFilters,
  persistFilters,
} from "../../utils/persistenceUtils";
import {
  READING_LIST_PERSISTENCE_KEY,
  READING_LIST_DEFAULT_FILTERS,
  type ReadingListSortType,
} from "../../data/readingListFilters";
import { logger } from "@/lib/logger";

type FilterType = "all" | "to-read" | "read";

export interface UseReadingListViewModelProps {
  initialFilter?: FilterType;
}

export function useReadingListViewModel({
  initialFilter = "all",
}: UseReadingListViewModelProps) {
  const { data: readingList = [] } = useReadingList();
  const addToReadingList = useAddToReadingList();
  const toggleRead = useToggleReadingListRead();
  const deleteFromReadingList = useDeleteFromReadingList();

  // Load persisted filter state
  const persistedFilters = getPersistedFilters(
    READING_LIST_PERSISTENCE_KEY,
    READING_LIST_DEFAULT_FILTERS
  );

  // Filter state
  const [filter] = useState<FilterType>(initialFilter);
  const [categoryFilters, setCategoryFilters] = useState<string[]>(
    persistedFilters.categoryFilters as string[]
  );
  const [sortBy, setSortBy] = useState<ReadingListSortType>(
    persistedFilters.sortBy as ReadingListSortType
  );
  // searchQuery is intentionally not persisted - resets on each visit for fresh search experience
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [bookToRecommend, setBookToRecommend] =
    useState<ReadingListItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<ReadingListItem | null>(
    null
  );

  // Persist filter changes
  useEffect(() => {
    persistFilters(READING_LIST_PERSISTENCE_KEY, {
      categoryFilters,
      sortBy,
    });
  }, [categoryFilters, sortBy]);

  // First, filter by read status to get the current view
  const filteredByStatus = useMemo(() => {
    if (filter === "to-read") return readingList.filter((b) => !b.read);
    if (filter === "read") return readingList.filter((b) => b.read);
    return readingList;
  }, [readingList, filter]);

  // Extract unique categories from the currently filtered books (by read status)
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    filteredByStatus.forEach((book) => {
      if (book.categories) {
        // Split by comma, slash, and/or ampersand, and trim whitespace
        book.categories.split(/[,/&]/).forEach((category) => {
          const trimmedCategory = category.trim().toLowerCase();
          if (trimmedCategory) categorySet.add(trimmedCategory);
        });
      }
    });
    return categorySet;
  }, [filteredByStatus]);

  // Define filter function (includes category filter)
  const filterFn = useCallback(
    (book: ReadingListItem) => {
      // Filter by read status
      if (filter === "to-read" && book.read) return false;
      if (filter === "read" && !book.read) return false;

      // Filter by categories (multiple selection support)
      if (categoryFilters.length === 0 || categoryFilters.includes("all")) {
        // Continue to search filter
      } else if (book.categories) {
        const bookCategories = book.categories
          .toLowerCase()
          .split(/[,/&]/)
          .map((c) => c.trim());
        const hasMatch = categoryFilters.some((selectedCategory) =>
          bookCategories.includes(selectedCategory)
        );
        if (!hasMatch) return false;
      } else {
        return false;
      }

      // Filter by search query (search title and author)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(query);
        const matchesAuthor = book.authors?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesAuthor) return false;
      }

      return true;
    },
    [filter, categoryFilters, searchQuery]
  );

  // Sort function
  const sortFn = useCallback(
    (a: ReadingListItem, b: ReadingListItem) => {
      switch (sortBy) {
        case "date-added":
          return (
            new Date(b.added_at || "").getTime() -
            new Date(a.added_at || "").getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "year":
          return (
            (b.published_date ? new Date(b.published_date).getFullYear() : 0) -
            (a.published_date ? new Date(a.published_date).getFullYear() : 0)
          );
        case "rating":
          return (b.personal_rating || 0) - (a.personal_rating || 0);
        default:
          return 0;
      }
    },
    [sortBy]
  );

  // URL-based pagination state
  const { page, perPage, setPage, setPerPage } = useUrlPaginationState(1, 10);

  const {
    items: paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
  } = useMediaFiltering({
    items: readingList,
    filterFn,
    sortFn,
    initialPage: page,
    initialItemsPerPage: perPage,
    persistenceKey: READING_LIST_PERSISTENCE_KEY,
    onPageChange: setPage,
    onItemsPerPageChange: setPerPage,
  });

  // Calculate counts for empty state logic
  const toReadCount = useMemo(
    () => readingList.filter((book) => !book.read).length,
    [readingList]
  );
  const readCount = useMemo(
    () => readingList.filter((book) => book.read).length,
    [readingList]
  );

  const hasItemsForCurrentFilter =
    filter === "all"
      ? readingList.length > 0
      : filter === "to-read"
      ? toReadCount > 0
      : readCount > 0;

  // Event handlers
  const handleAddToReadingList = useCallback(
    (result: MediaItem) => {
      const shouldMarkAsRead = filter === "read";

      void addToReadingList.mutateAsync({
        external_id: result.external_id,
        title: result.title,
        authors: result.authors || null,
        thumbnail_url: result.poster_url,
        published_date: result.release_date || null,
        description: result.description || null,
        isbn: result.isbn || null,
        page_count: result.page_count || null,
        categories: result.categories || null,
        read: shouldMarkAsRead,
      });
      setShowSearchModal(false);
    },
    [addToReadingList, filter]
  );

  const handleToggleRead = useCallback(
    (id: string | number) => {
      void toggleRead.mutateAsync(String(id));
    },
    [toggleRead]
  );

  const handleRemove = useCallback(
    (id: string | number) => {
      const book = readingList.find((b) => b.id === String(id));
      if (!book) return;

      setBookToDelete(book);
      setShowDeleteModal(true);
    },
    [readingList]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!bookToDelete) return;

    try {
      await deleteFromReadingList.mutateAsync(bookToDelete.id);
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      logger.error("Failed to delete book", { error, bookId: bookToDelete.id });
      // Keep modal open so user sees the action failed
    }
  }, [bookToDelete, deleteFromReadingList]);

  const handlePageChange = useCallback(
    (page: number, scrollRef?: React.RefObject<HTMLDivElement | null>) => {
      setCurrentPage(page);
      scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
    },
    [setCurrentPage]
  );

  return {
    // Data
    paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    readingList,
    availableCategories,

    // Counts
    toReadCount,
    readCount,
    hasItemsForCurrentFilter,

    // Filter state
    filter,
    categoryFilters,
    sortBy,
    searchQuery,

    // Filter setters
    setCategoryFilters,
    setSortBy,
    setSearchQuery,

    // Pagination
    setCurrentPage,
    setItemsPerPage,
    handlePageChange,

    // Modal state
    showSearchModal,
    setShowSearchModal,
    showSendModal,
    setShowSendModal,
    bookToRecommend,
    setBookToRecommend,
    showDeleteModal,
    setShowDeleteModal,
    bookToDelete,
    setBookToDelete,

    // Handlers
    handleAddToReadingList,
    handleToggleRead,
    handleRemove,
    handleConfirmDelete,

    // Loading flags
    isDeleting: deleteFromReadingList.isPending,
  };
}
