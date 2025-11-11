import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../shared/Button";

interface WatchlistPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  showItemsPerPageMenu: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onToggleMenu: () => void;
}

/**
 * Pagination controls for watchlist
 * Handles items per page selector and page navigation
 */
const WatchlistPagination: React.FC<WatchlistPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasNextPage,
  hasPrevPage,
  showItemsPerPageMenu,
  onPageChange,
  onItemsPerPageChange,
  onToggleMenu,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Items per page */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button
            onClick={onToggleMenu}
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
                    onItemsPerPageChange(size);
                    onToggleMenu();
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
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            variant="subtle"
            size="icon"
            icon={<ChevronLeft className="w-4 h-4" />}
            aria-label="Previous page"
          />
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            variant="subtle"
            size="icon"
            icon={<ChevronRight className="w-4 h-4" />}
            aria-label="Next page"
          />
        </div>
      </div>
    </div>
  );
};

export default WatchlistPagination;
