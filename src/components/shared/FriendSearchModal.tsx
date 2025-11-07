import { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Users, Check } from "lucide-react";
import { useUserSearch, useCreateConnection } from "../../hooks/useUserSearch";
import Button from "./Button";

interface FriendSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FriendSearchModal
 * Modal for searching and connecting with other users
 */
export function FriendSearchModal({ isOpen, onClose }: FriendSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const pageSize = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const { data, isLoading } = useUserSearch(
    debouncedQuery,
    currentPage,
    pageSize
  );
  const createConnection = useCreateConnection();

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    // Focus search input when modal opens
    searchInputRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTabKey);

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleConnect = async (userId: string) => {
    try {
      await createConnection.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const users = data?.users || [];
  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="friend-search-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Users className="w-5 h-5 text-pink-500" />
            </div>
            <h2
              id="friend-search-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              Find Friends
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="subtle"
            size="icon"
            icon={<X className="w-5 h-5" />}
            aria-label="Close modal"
          />
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label="Search for users"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Searching...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "No users found"
                  : "Start typing to search for friends"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {user.display_name}
                      </h3>
                      {user.mutual_friends_count > 0 && !user.is_connected && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.mutual_friends_count} mutual{" "}
                          {user.mutual_friends_count === 1
                            ? "friend"
                            : "friends"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {user.is_connected ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-4 h-4" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => void handleConnect(user.user_id)}
                      disabled={createConnection.isPending}
                      variant="subtle"
                      size="sm"
                      icon={<UserPlus className="w-4 h-4" />}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      aria-label={`Connect with ${user.display_name}`}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
