import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Button from "../ui/Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const [showItemsPerPageMenu, setShowItemsPerPageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowItemsPerPageMenu(false);
      }
    };

    if (showItemsPerPageMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showItemsPerPageMenu]);

  if (totalPages <= 1) {
    return null;
  }

  const itemsPerPageOptions = [10, 25, 50, 100];

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      {/* Items per page selector */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowItemsPerPageMenu(!showItemsPerPageMenu)}
          className="px-3 py-2 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Select items per page"
        >
          {itemsPerPage} per page
        </button>

        {showItemsPerPageMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowItemsPerPageMenu(false)}
            />
            {/* Dropdown menu */}
            <div className="absolute bottom-full mb-2 left-0 z-50 min-w-[120px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
              {itemsPerPageOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onItemsPerPageChange(option);
                    setShowItemsPerPageMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors ${
                    option === itemsPerPage
                      ? "bg-gray-100 dark:bg-gray-700 font-medium"
                      : ""
                  }`}
                >
                  {option} per page
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Page info */}
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <span className="text-gray-400 dark:text-gray-600">•</span>
        <span>({totalItems} total)</span>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="whitespace-nowrap"
        >
          <div className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </div>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="whitespace-nowrap"
        >
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </Button>
      </div>
    </div>
  );
}
