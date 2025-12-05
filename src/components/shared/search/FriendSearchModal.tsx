import { useState, useEffect, useRef } from "react";
import { UserPlus, Users, Check } from "lucide-react";
import {
  useUserSearch,
  useCreateConnection,
} from "../../../hooks/useUserSearch";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { logger } from "@/lib/logger";

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

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  const handleConnect = async (userId: string) => {
    try {
      await createConnection.mutateAsync(userId);
    } catch (error) {
      logger.error("Failed to connect to user", { error, userId });
    }
  };

  const users = data?.users || [];
  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Find Friends"
      maxWidth="2xl"
    >
      <div ref={modalRef} className="flex flex-col max-h-[70vh]">
        {/* Icon decoration */}
        <div className="flex items-center gap-3 pb-4">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Users className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search and connect with other users
          </p>
        </div>

        {/* Search Input */}
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          \n{" "}
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search for users"
          />
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
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
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
    </Modal>
  );
}

export default FriendSearchModal;
