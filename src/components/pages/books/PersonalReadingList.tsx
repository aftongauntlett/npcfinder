import React, { useState, useRef } from "react";
import {
  Plus,
  BookOpen,
  List,
  Check,
  Grid3x3,
  ChevronDown,
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
import SendMediaModal from "../../shared/SendMediaModal";
import Toast from "../../ui/Toast";
import { searchBooks } from "../../../utils/bookSearchAdapters";
import {
  useReadingList,
  useAddToReadingList,
  useToggleReadingListRead,
  useDeleteFromReadingList,
} from "../../../hooks/useReadingListQueries";
import { useViewMode } from "../../../hooks/useViewMode";
import type { ReadingListItem } from "../../../services/booksService.types";
import BookCard from "./BookCard";

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
  // Fetch reading list from database
  const { data: readingList = [] } = useReadingList();
  const addToReadingList = useAddToReadingList();
  const toggleRead = useToggleReadingListRead();
  const deleteFromReadingList = useDeleteFromReadingList();

  // Filter is controlled by tabs (initialFilter prop), not by dropdown
  const [filter] = useState<FilterType>(initialFilter);
  const [sortBy, setSortBy] = useState<SortType>("date-added");
  const [viewMode, setViewMode] = useViewMode("grid");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ReadingListItem | null>(
    null
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [bookToRecommend, setBookToRecommend] =
    useState<ReadingListItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showItemsPerPageMenu, setShowItemsPerPageMenu] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const [lastDeletedItem, setLastDeletedItem] =
    useState<ReadingListItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Add to reading list
  const handleAddToReadingList = (result: MediaItem) => {
    // If we're on the "read" tab, mark as read immediately
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
      read: shouldMarkAsRead,
    });
    setShowSearchModal(false);
  };

  // Toggle read status
  const handleToggleRead = (id: string) => {
    void toggleRead.mutateAsync(id);
  };

  // Remove from reading list with undo
  const handleRemove = (book: ReadingListItem) => {
    setLastDeletedItem(book);
    void deleteFromReadingList.mutateAsync(book.id);
    setShowUndoToast(true);
  };

  // Undo deletion
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
        read: lastDeletedItem.read,
      });
      setLastDeletedItem(null);
    }
    setShowUndoToast(false);
  };

  // Filter books based on filter
  const filteredBooks = readingList.filter((book: ReadingListItem) => {
    if (filter === "to-read") return !book.read;
    if (filter === "read") return book.read;
    return true; // "all"
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
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
  });

  // Pagination
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBooks = sortedBooks.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page
    setShowItemsPerPageMenu(false);
  };

  // Recommend book to friend
  const handleRecommend = (book: ReadingListItem) => {
    setBookToRecommend(book);
    setShowSendModal(true);
  };

  const sortOptions = [
    { value: "date-added" as SortType, label: "Recently Added" },
    { value: "title" as SortType, label: "Title" },
    { value: "year" as SortType, label: "Publication Year" },
    { value: "rating" as SortType, label: "Your Rating" },
  ];

  const itemsPerPageOptions = [10, 25, 50, 100];

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

  return (
    <div ref={topRef} className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side: Sort and View Toggle */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="font-medium">
                {sortBy === "date-added" && "Sort: Date Added"}
                {sortBy === "title" && "Sort: Title (A-Z)"}
                {sortBy === "year" && "Sort: Year"}
                {sortBy === "rating" && "Sort: Rating"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                        sortBy === option.value
                          ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {sortBy === option.value && (
                        <Check className="w-4 h-4 inline-block mr-2 text-primary" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
              title="Grid view"
              aria-label="Switch to grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid3x3 className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
              title="List view"
              aria-label="Switch to list view"
              aria-pressed={viewMode === "list"}
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right side: Add and Import Buttons */}
        <div className="flex items-center gap-3">
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

      {/* Books Display */}
      {currentBooks.length === 0 ? (
        <MediaEmptyState
          icon={BookOpen}
          description={emptyStateProps.message}
          title={emptyStateProps.title}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {currentBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.authors}
              thumbnailUrl={book.thumbnail_url}
              year={
                book.published_date
                  ? new Date(book.published_date).getFullYear().toString()
                  : undefined
              }
              personalRating={book.personal_rating}
              status={book.read ? "read" : "reading"}
              onClick={() => setSelectedBook(book)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {currentBooks.map((book) => (
            <MediaListItem
              key={book.id}
              id={book.id}
              title={book.title}
              subtitle={book.authors || undefined}
              posterUrl={book.thumbnail_url || undefined}
              description={book.description || undefined}
              onClick={() => setSelectedBook(book)}
              isCompleted={book.read}
              onToggleComplete={(id) => void handleToggleRead(id as string)}
              onRecommend={book.read ? () => handleRecommend(book) : undefined}
              onRemove={() => handleRemove(book)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedBooks.length)}{" "}
              of {sortedBooks.length}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowItemsPerPageMenu(!showItemsPerPageMenu)}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span>{itemsPerPage} per page</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showItemsPerPageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowItemsPerPageMenu(false)}
                  />
                  <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    {itemsPerPageOptions.map((count) => (
                      <button
                        key={count}
                        onClick={() => handleItemsPerPageChange(count)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                          itemsPerPage === count
                            ? "text-primary dark:text-primary-light font-medium"
                            : ""
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSearchModal && (
        <SearchBookModal
          onClose={() => setShowSearchModal(false)}
          onSelect={handleAddToReadingList}
        />
      )}

      {showImportModal && (
        <ImportBooksModal onClose={() => setShowImportModal(false)} />
      )}

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onToggleRead={() => handleToggleRead(selectedBook.id)}
          onRemove={() => {
            handleRemove(selectedBook);
            setSelectedBook(null);
          }}
          onRecommend={() => {
            handleRecommend(selectedBook);
          }}
        />
      )}

      {showSendModal && bookToRecommend && (
        <SendMediaModal
          isOpen={true}
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
          preselectedItem={{
            external_id: bookToRecommend.external_id,
            title: bookToRecommend.title,
            authors: bookToRecommend.authors || undefined,
            poster_url: bookToRecommend.thumbnail_url,
            release_date: bookToRecommend.published_date || undefined,
            description: bookToRecommend.description || undefined,
            isbn: bookToRecommend.isbn || undefined,
            page_count: bookToRecommend.page_count || undefined,
          }}
        />
      )}

      {/* Undo Toast */}
      {showUndoToast && (
        <Toast
          message="Book removed from reading list"
          onClose={() => setShowUndoToast(false)}
          action={{
            label: "Undo",
            onClick: handleUndo,
          }}
        />
      )}
    </div>
  );
};

export default PersonalReadingList;
