import React from "react";
import { Plus } from "lucide-react";
import type { BookItem } from "../../../utils/googleBooksDiscovery";
import { formatReleaseYear } from "../../../utils/dateFormatting";

interface SimilarBooksCarouselProps {
  books: BookItem[];
  onAddToReadingList: (book: BookItem) => void;
  existingIds: string[];
}

export const SimilarBooksCarousel: React.FC<SimilarBooksCarouselProps> = ({
  books,
  onAddToReadingList,
  existingIds,
}) => {
  if (books.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        More Like This
      </h3>
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex gap-4 pb-4">
          {books.map((book) => {
            const isInReadingList = existingIds.includes(book.external_id);

            return (
              <div key={book.external_id} className="flex-shrink-0 w-32 group">
                {/* Book Cover */}
                <div className="relative mb-2">
                  {book.thumbnail_url ? (
                    <img
                      src={book.thumbnail_url}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        No Image
                      </span>
                    </div>
                  )}

                  {/* Add button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isInReadingList) {
                        onAddToReadingList(book);
                      }
                    }}
                    disabled={isInReadingList}
                    className={`absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                      isInReadingList ? "cursor-default" : ""
                    }`}
                    title={
                      isInReadingList
                        ? "Already in reading list"
                        : "Add to reading list"
                    }
                  >
                    {isInReadingList ? (
                      <span className="text-white text-xs font-medium px-3 py-1.5 bg-gray-700 rounded-full">
                        In List
                      </span>
                    ) : (
                      <div className="bg-primary hover:bg-primary/90 text-white rounded-full p-2 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Title and author */}
                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 leading-tight">
                  {book.title}
                </h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {book.authors && (
                    <div className="line-clamp-1 mb-1">{book.authors}</div>
                  )}
                  {book.published_date && (
                    <span>{formatReleaseYear(book.published_date)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
