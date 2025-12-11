import React, { useRef, useState } from "react";
import { Pagination } from "../../shared/common/Pagination";
import SearchBookModal from "../../shared/search/SearchBookModal";
import MediaListItem from "../../media/MediaListItem";
import SendMediaModal from "../../shared/media/SendMediaModal";
import ConfirmationModal from "../../shared/ui/ConfirmationModal";
import { searchBooks } from "../../../utils/bookSearchAdapters";
import { useReadingListViewModel } from "../../../hooks/books/useReadingListViewModel";
import ReadingListToolbar from "./ReadingListToolbar";
import ReadingListEmptyState from "./ReadingListEmptyState";

type FilterType = "all" | "to-read" | "read";

interface PersonalReadingListProps {
  initialFilter?: FilterType;
  embedded?: boolean;
}

const PersonalReadingList: React.FC<PersonalReadingListProps> = ({
  initialFilter = "all",
  embedded: _embedded = false,
}) => {
  // Ref for scroll-to-top
  const topRef = useRef<HTMLDivElement>(null);

  // Collapse state
  const [collapseKey, setCollapseKey] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleCollapseAll = () => {
    setCollapseKey((prev) => prev + 1);
    setExpandedItems(new Set());
  };

  const handleExpandChange = (id: string, isExpanded: boolean) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Use the view model hook
  const {
    paginatedItems,
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    readingList,
    availableCategories,
    toReadCount: _toReadCount,
    readCount: _readCount,
    hasItemsForCurrentFilter,
    filter,
    categoryFilters,
    sortBy,
    searchQuery,
    setCategoryFilters,
    setSortBy,
    setSearchQuery,
    setItemsPerPage,
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
    handleAddToReadingList,
    handleToggleRead,
    handleRemove,
    handleConfirmDelete,
    handlePageChange,
    isDeleting,
  } = useReadingListViewModel({ initialFilter });

  return (
    <div
      ref={topRef}
      className="container mx-auto px-4 sm:px-6"
    >
      {/* Controls Row: Filter/Sort + Actions */}
      {hasItemsForCurrentFilter && (
        <ReadingListToolbar
          availableCategories={availableCategories}
          categoryFilters={categoryFilters}
          sortBy={sortBy}
          searchQuery={searchQuery}
          onCategoryChange={setCategoryFilters}
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
          onAddClick={() => setShowSearchModal(true)}
          onCollapseAll={handleCollapseAll}
          hasExpandedItems={expandedItems.size > 0}
        />
      )}

      {/* Content: List or Empty State */}
      <ReadingListEmptyState
        filter={filter}
        hasItemsForCurrentFilter={hasItemsForCurrentFilter}
        totalItems={totalItems}
        categoryFilters={categoryFilters}
        onAddClick={() => setShowSearchModal(true)}
      />

      {/* List View */}
      {hasItemsForCurrentFilter && totalItems > 0 && (
        <>
          <div className="space-y-4">
            {paginatedItems.map((book) => (
              <MediaListItem
                key={`${book.id}-${collapseKey}`}
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
                mediaType="book"
                externalId={book.external_id}
                authors={book.authors || undefined}
                isbn={book.isbn || undefined}
                pageCount={book.page_count || undefined}
                isCompleted={book.read}
                onToggleComplete={handleToggleRead}
                onRemove={handleRemove}
                onRecommend={() => {
                  setBookToRecommend(book);
                  setShowSendModal(true);
                }}
                onExpandChange={(isExpanded) => handleExpandChange(book.id, isExpanded)}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => handlePageChange(page, topRef)}
            onItemsPerPageChange={setItemsPerPage}
          />
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBookToDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove from Reading List?"
        message={
          bookToDelete
            ? `Are you sure you want to remove "${bookToDelete.title}" from your reading list?`
            : ""
        }
        confirmText="Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PersonalReadingList;
