import React, { useState, useRef, useMemo, useCallback } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { MediaItem } from "../../shared/media/SendMediaModal";
import SearchBookModal from "../../shared/search/SearchBookModal";
import BookDetailModal from "./BookDetailModal";
import MediaEmptyState from "../../media/MediaEmptyState";
import MediaListItem from "../../media/MediaListItem";
import { FilterSortSection } from "../../shared/common/FilterSortMenu";
import SendMediaModal from "../../shared/media/SendMediaModal";
import Toast from "../../ui/Toast";
import Button from "../../shared/ui/Button";
import { MediaPageToolbar } from "../../shared/media/MediaPageToolbar";
import { useMediaFiltering } from "../../../hooks/useMediaFiltering";
import { searchBooks } from "../../../utils/bookSearchAdapters";
import {
  useReadingList,
  useAddToReadingList,
  useToggleReadingListRead,
  useDeleteFromReadingList,
} from "../../../hooks/useReadingListQueries";
import type { ReadingListItem } from "../../../services/booksService.types";

type FilterType = "all" | "to-read" | "read";
type SortType = "date-added" | "title" | "year" | "rating";

interface PersonalReadingListProps {
  initialFilter?: FilterType;
  embedded?: boolean;
}

const PersonalReadingList: React.FC<PersonalReadingListProps> = ({
  initialFilter = "all",
  embedded: _embedded = false,
}) => {
  // Data fetching
  const { data: readingList = [] } = useReadingList();
  const addToReadingList = useAddToReadingList();
  const toggleRead = useToggleReadingListRead();
  const deleteFromReadingList = useDeleteFromReadingList();

  // Filter state (controlled by tabs via prop)
  const [filter] = useState<FilterType>(initialFilter);
  const [categoryFilters, setCategoryFilters] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("date-added");

  // Pagination state
  const [showItemsPerPageMenu, setShowItemsPerPageMenu] = useState(false);

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ReadingListItem | null>(
    null
  );
  const [bookToRecommend, setBookToRecommend] =
    useState<ReadingListItem | null>(null);

  // Undo state
  const [lastDeletedItem, setLastDeletedItem] =
    useState<ReadingListItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Ref for scroll-to-top
  const topRef = useRef<HTMLDivElement>(null);

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

  // Create filter & sort sections for FilterSortMenu
  const filterSortSections = useMemo((): FilterSortSection[] => {
    // Sort categories alphabetically
    const sortedCategories = Array.from(availableCategories).sort();

    const categoryOptions = [
      { id: "all", label: "All Categories" },
      ...sortedCategories.map((category) => ({
        id: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
      })),
    ];

    return [
      {
        id: "category",
        title: "Category",
        multiSelect: true,
        options: categoryOptions,
      },
      {
        id: "sort",
        title: "Sort By",
        options: [
          { id: "date-added", label: "Recently Added" },
          { id: "title", label: "Title" },
          { id: "year", label: "Publication Year" },
          { id: "rating", label: "Your Rating" },
        ],
      },
    ];
  }, [availableCategories]);

  // Define filter function (now includes category filter)
  const filterFn = useCallback(
    (book: ReadingListItem) => {
      // Filter by read status
      if (filter === "to-read" && book.read) return false;
      if (filter === "read" && !book.read) return false;

      // Filter by categories (multiple selection support)
      if (categoryFilters.length === 0 || categoryFilters.includes("all")) {
        return true;
      }

      // Book matches if it matches ANY of the selected categories
      if (book.categories) {
        const bookCategories = book.categories
          .toLowerCase()
          .split(/[,/&]/)
          .map((c) => c.trim());
        return categoryFilters.some((selectedCategory) =>
          bookCategories.includes(selectedCategory)
        );
      }

      return false;
    },
    [filter, categoryFilters]
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

  // Use the filtering hook
  const {
    items: paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    setCurrentPage,
    hasNextPage,
    hasPrevPage,
    itemsPerPage,
    setItemsPerPage,
  } = useMediaFiltering({
    items: readingList,
    filterFn,
    sortFn,
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
  const handleAddToReadingList = (result: MediaItem) => {
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
  };

  const handleToggleRead = (id: string | number) => {
    void toggleRead.mutateAsync(String(id));
  };

  const handleRemove = (id: string | number) => {
    const book = readingList.find((b) => b.id === String(id));
    if (!book) return;

    setLastDeletedItem(book);
    setShowUndoToast(true);
    void deleteFromReadingList.mutateAsync(book.id);
  };

  const handleUndo = () => {
    if (lastDeletedItem) {
      void addToReadingList.mutateAsync({
        external_id: lastDeletedItem.external_id,
        title: lastDeletedItem.title,
        authors: lastDeletedItem.authors,
        thumbnail_url: lastDeletedItem.thumbnail_url,
        published_date: lastDeletedItem.published_date,
        description: lastDeletedItem.description,
        isbn: lastDeletedItem.isbn,
        page_count: lastDeletedItem.page_count,
        categories: lastDeletedItem.categories,
        read: lastDeletedItem.read,
      });
      setLastDeletedItem(null);
    }
    setShowUndoToast(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Empty state props
  const emptyStateProps =
    filter === "read"
      ? {
          title: "Your Reading list is empty",
          message:
            "You haven't added any books to your list yet. Add books to start tracking what you're currently reading!",
        }
      : filter === "to-read"
      ? {
          title: "Your Reading list is empty",
          message:
            "You haven't added any books to your list yet. Add books to start tracking what you're currently reading!",
        }
      : {
          title: "Your Reading list is empty",
          message:
            "You haven't added any books to your list yet. Add books to start tracking what you're currently reading!",
        };

  return (
    <div
      ref={topRef}
      className="container mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6"
    >
      {/* Controls Row: Filter/Sort + Actions */}
      {hasItemsForCurrentFilter && (
        <div className="space-y-3 mb-6">
          <MediaPageToolbar
            filterConfig={{
              type: "menu",
              sections: filterSortSections,
              activeFilters: {
                category: categoryFilters,
                sort: sortBy,
              },
              onFilterChange: (sectionId, value) => {
                if (sectionId === "category") {
                  const categories = Array.isArray(value) ? value : [value];
                  setCategoryFilters(categories);
                } else if (sectionId === "sort") {
                  setSortBy(value as SortType);
                }
              },
            }}
            onAddClick={() => setShowSearchModal(true)}
          />

          {/* Active Filter Chips */}
          {!categoryFilters.includes("all") && categoryFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    const newFilters = categoryFilters.filter(
                      (c) => c !== category
                    );
                    setCategoryFilters(
                      newFilters.length > 0 ? newFilters : ["all"]
                    );
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  <span className="text-purple-600 dark:text-purple-400">
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content: List or Empty State */}
      {!hasItemsForCurrentFilter ? (
        <MediaEmptyState
          icon={BookOpen}
          title={emptyStateProps.title}
          description={emptyStateProps.message}
          onClick={() => setShowSearchModal(true)}
          ariaLabel="Add books to your reading list"
        />
      ) : totalItems === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No books found in selected{" "}
            {categoryFilters.length === 1 && categoryFilters[0] !== "all"
              ? categoryFilters[0]
              : ""}{" "}
            {categoryFilters.length > 1
              ? `categories (${categoryFilters.join(", ")})`
              : "categories"}
          </p>
        </div>
      ) : (
        <>
          {/* List View */}
          <div className="space-y-4">
            {paginatedItems.map((book) => (
              <MediaListItem
                key={book.id}
                id={book.id}
                title={book.title}
                subtitle={book.authors || undefined}
                posterUrl={book.thumbnail_url || undefined}
                year={
                  book.published_date
                    ? new Date(book.published_date).getFullYear()
                    : undefined
                }
                description={book.description || undefined}
                personalRating={book.personal_rating || undefined}
                category={book.categories || undefined}
                isCompleted={book.read}
                onToggleComplete={handleToggleRead}
                onRemove={handleRemove}
                onClick={() => setSelectedBook(book)}
                onRecommend={() => {
                  setBookToRecommend(book);
                  setShowSendModal(true);
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Items per page */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Button
                    onClick={() =>
                      setShowItemsPerPageMenu(!showItemsPerPageMenu)
                    }
                    variant="secondary"
                    size="sm"
                    aria-expanded={showItemsPerPageMenu}
                  >
                    {itemsPerPage}
                  </Button>
                  {showItemsPerPageMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1">
                      {[10, 25, 50, 100].map((size) => (
                        <Button
                          key={size}
                          onClick={() => {
                            setItemsPerPage(size);
                            setShowItemsPerPageMenu(false);
                          }}
                          variant="subtle"
                          size="sm"
                          fullWidth
                          className={`justify-start px-3 py-2 ${
                            itemsPerPage === size
                              ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                              : ""
                          }`}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  per page ({totalItems} total)
                </span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    variant="subtle"
                    size="icon"
                    icon={<ChevronLeft className="w-4 h-4" />}
                    aria-label="Previous page"
                  />
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    variant="subtle"
                    size="icon"
                    icon={<ChevronRight className="w-4 h-4" />}
                    aria-label="Next page"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showSearchModal && (
        <SearchBookModal
          onClose={() => setShowSearchModal(false)}
          onSelect={handleAddToReadingList}
          existingIds={readingList.map((book) => book.external_id)}
        />
      )}

      <SendMediaModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setBookToRecommend(null);
        }}
        onSent={() => {
          setShowSendModal(false);
          setBookToRecommend(null);
        }}
        mediaType="books"
        tableName="book_recommendations"
        searchPlaceholder="Search for books..."
        searchFunction={searchBooks}
        recommendationTypes={[
          { value: "read", label: "Read" },
          { value: "listen", label: "Listen" },
        ]}
        defaultRecommendationType="read"
        preselectedItem={
          bookToRecommend
            ? {
                external_id: bookToRecommend.external_id,
                title: bookToRecommend.title,
                authors: bookToRecommend.authors || undefined,
                poster_url: bookToRecommend.thumbnail_url,
                release_date: bookToRecommend.published_date,
                description: bookToRecommend.description,
              }
            : undefined
        }
      />

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onToggleRead={() => handleToggleRead(selectedBook.id)}
          onRemove={() => {
            handleRemove(selectedBook.id);
            setSelectedBook(null);
          }}
        />
      )}

      {/* Undo Toast */}
      {showUndoToast && lastDeletedItem && (
        <Toast
          message={`Removed "${lastDeletedItem.title}"`}
          action={{
            label: "Undo",
            onClick: handleUndo,
          }}
          onClose={() => {
            setShowUndoToast(false);
            setLastDeletedItem(null);
          }}
        />
      )}
    </div>
  );
};

export default PersonalReadingList;
