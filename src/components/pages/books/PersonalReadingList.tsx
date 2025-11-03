import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Plus,
  BookOpen,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MediaItem } from "../../shared/SendMediaModal";
import SearchBookModal from "../../shared/SearchBookModal";
import BookDetailModal from "./BookDetailModal";
import ImportBooksModal from "./ImportBooksModal";
import Button from "../../shared/Button";
import MediaEmptyState from "../../media/MediaEmptyState";
import MediaListItem from "../../media/MediaListItem";
import MediaTypeFilters, { FilterOption } from "../../media/MediaTypeFilters";
import SortDropdown, { SortOption } from "../../media/SortDropdown";
import SendMediaModal from "../../shared/SendMediaModal";
import Toast from "../../ui/Toast";
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
type CategoryFilter =
  | "all"
  | "fiction"
  | "nonfiction"
  | "fantasy"
  | "romance"
  | "mystery"
  | "biography"
  | "history"
  | "science";

interface PersonalReadingListProps {
  initialFilter?: FilterType;
  embedded?: boolean;
}

// Category filter configuration
const CATEGORY_FILTERS: FilterOption[] = [
  { id: "all", label: "All Books" },
  {
    id: "fiction",
    label: "Fiction",
    colorClass:
      "bg-blue-500/20 text-blue-700 dark:text-blue-200 ring-2 ring-blue-500/50",
  },
  {
    id: "nonfiction",
    label: "Non-Fiction",
    colorClass:
      "bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 ring-2 ring-indigo-500/50",
  },
  {
    id: "fantasy",
    label: "Fantasy",
    colorClass:
      "bg-purple-500/20 text-purple-700 dark:text-purple-200 ring-2 ring-purple-500/50",
  },
  {
    id: "romance",
    label: "Romance",
    colorClass:
      "bg-pink-500/20 text-pink-700 dark:text-pink-200 ring-2 ring-pink-500/50",
  },
  {
    id: "mystery",
    label: "Mystery",
    colorClass:
      "bg-amber-500/20 text-amber-700 dark:text-amber-200 ring-2 ring-amber-500/50",
  },
  {
    id: "biography",
    label: "Biography",
    colorClass:
      "bg-teal-500/20 text-teal-700 dark:text-teal-200 ring-2 ring-teal-500/50",
  },
  {
    id: "history",
    label: "History",
    colorClass:
      "bg-orange-500/20 text-orange-700 dark:text-orange-200 ring-2 ring-orange-500/50",
  },
  {
    id: "science",
    label: "Science",
    colorClass:
      "bg-green-500/20 text-green-700 dark:text-green-200 ring-2 ring-green-500/50",
  },
];

// Sort options
const SORT_OPTIONS: SortOption[] = [
  { id: "date-added", label: "Recently Added" },
  { id: "title", label: "Title" },
  { id: "year", label: "Publication Year" },
  { id: "rating", label: "Your Rating" },
];

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
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-added");

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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

  // Determine which categories have books (for filtering available categories)
  const availableCategories = useMemo(() => {
    const categories = new Set<CategoryFilter>(["all"]);

    readingList.forEach((book) => {
      if (book.categories) {
        const cats = book.categories.toLowerCase();

        if (cats.includes("fiction") && !cats.includes("non-fiction")) {
          categories.add("fiction");
        }
        if (cats.includes("non-fiction") || cats.includes("nonfiction")) {
          categories.add("nonfiction");
        }
        if (cats.includes("fantasy")) categories.add("fantasy");
        if (cats.includes("romance")) categories.add("romance");
        if (
          cats.includes("mystery") ||
          cats.includes("thriller") ||
          cats.includes("crime")
        ) {
          categories.add("mystery");
        }
        if (cats.includes("biography") || cats.includes("memoir")) {
          categories.add("biography");
        }
        if (cats.includes("history")) categories.add("history");
        if (cats.includes("science") || cats.includes("technology")) {
          categories.add("science");
        }
      }
    });

    return categories;
  }, [readingList]);

  // Category matching helper
  const bookMatchesCategory = (
    book: ReadingListItem,
    category: CategoryFilter
  ): boolean => {
    if (category === "all") return true;
    if (!book.categories) return false;

    const cats = book.categories.toLowerCase();

    switch (category) {
      case "fiction":
        return cats.includes("fiction") && !cats.includes("non-fiction");
      case "nonfiction":
        return cats.includes("non-fiction") || cats.includes("nonfiction");
      case "fantasy":
        return cats.includes("fantasy");
      case "romance":
        return cats.includes("romance");
      case "mystery":
        return (
          cats.includes("mystery") ||
          cats.includes("thriller") ||
          cats.includes("crime")
        );
      case "biography":
        return cats.includes("biography") || cats.includes("memoir");
      case "history":
        return cats.includes("history");
      case "science":
        return cats.includes("science") || cats.includes("technology");
      default:
        return true;
    }
  };

  // Filter function
  const filterFn = useCallback(
    (book: ReadingListItem) => {
      // Filter by read status
      if (filter === "to-read" && book.read) return false;
      if (filter === "read" && !book.read) return false;

      // Filter by category
      return bookMatchesCategory(book, categoryFilter);
    },
    [filter, categoryFilter]
  );

  // Sort function
  const sortFn = useCallback(
    (a: ReadingListItem, b: ReadingListItem) => {
      switch (sortBy) {
        case "date-added":
          return (
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime()
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
          title: "No books read yet",
          message:
            "Mark books as read to track your reading history and share recommendations.",
        }
      : filter === "to-read"
      ? {
          title: "Your reading list is empty",
          message:
            "Start building your reading list by searching for books below.",
        }
      : {
          title: "No books yet",
          message: "Add your first book to get started tracking your reading.",
        };

  // Filter available category options
  const availableCategoryFilters = CATEGORY_FILTERS.filter((filter) =>
    availableCategories.has(filter.id as CategoryFilter)
  );

  return (
    <div ref={topRef} className="space-y-6">
      {/* Controls Row: Filters + Sort + Actions */}
      {hasItemsForCurrentFilter && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Category Filter Chips */}
          <MediaTypeFilters
            filters={availableCategoryFilters}
            activeFilter={categoryFilter}
            onFilterChange={(filterId) =>
              setCategoryFilter(filterId as CategoryFilter)
            }
          />

          {/* Right: Sort + Action Buttons */}
          <div className="flex items-center gap-3">
            <SortDropdown
              options={SORT_OPTIONS}
              activeSort={sortBy}
              onSortChange={(sortId) => setSortBy(sortId as SortType)}
            />

            <Button
              onClick={() => setShowSearchModal(true)}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add
            </Button>

            <Button
              onClick={() => setShowImportModal(true)}
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
            >
              Import
            </Button>
          </div>
        </div>
      )}

      {/* Content: List or Empty State */}
      {!hasItemsForCurrentFilter ? (
        <MediaEmptyState
          icon={BookOpen}
          title={emptyStateProps.title}
          description={emptyStateProps.message}
        />
      ) : totalItems === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No books found in{" "}
            {categoryFilter === "all" ? "any" : categoryFilter} category
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
                  <button
                    onClick={() => {
                      const menu = document.getElementById(
                        "items-per-page-menu-books"
                      );
                      if (menu) {
                        menu.style.display =
                          menu.style.display === "block" ? "none" : "block";
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {itemsPerPage}
                  </button>
                  <div
                    id="items-per-page-menu-books"
                    style={{ display: "none" }}
                    className="absolute bottom-full left-0 mb-2 w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          document.getElementById(
                            "items-per-page-menu-books"
                          )!.style.display = "none";
                        }}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          itemsPerPage === size
                            ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
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
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
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
          onRecommend={() => {
            setBookToRecommend(selectedBook);
            setShowSendModal(true);
          }}
        />
      )}

      {showImportModal && (
        <ImportBooksModal onClose={() => setShowImportModal(false)} />
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
