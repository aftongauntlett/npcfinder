import { useState, useEffect } from "react";
import { Search, UserPlus, Users, Check } from "lucide-react";
import {
  useUserSearch,
  useCreateConnection,
} from "../../../hooks/useUserSearch";
import Button from "../ui/Button";
import Input from "../ui/Input";

/**
 * UserSearch Component
 * Inline user search for finding and connecting with other users
 * Used in dashboard Find Friends tab
 */
export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleConnect = async (userId: string) => {
    try {
      await createConnection.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const users = data?.users || [];
  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <Input
        type="text"
        placeholder="Search by username..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5 text-gray-400" />}
        aria-label="Search for users"
      />

      {/* User List */}
      <div>
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
                        {user.mutual_friends_count === 1 ? "friend" : "friends"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connect Button */}
                {user.is_connected ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => void handleConnect(user.user_id)}
                    disabled={createConnection.isPending}
                    variant="primary"
                    size="sm"
                    icon={<UserPlus className="w-4 h-4" />}
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
        <div className="flex items-center justify-between pt-4">
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
  );
}

export default UserSearch;
