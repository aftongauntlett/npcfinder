import React from "react";
import { Search } from "lucide-react";
import Input from "../../../shared/ui/Input";
import EmptyState from "../../../shared/common/EmptyState";
import { Pagination } from "../../../shared/common/Pagination";
import UserTable from "../components/UserTable";
import UserCard from "../components/UserCard";
import type { UserRole } from "../../../../contexts/AdminContext";

interface User {
  id: string;
  display_name: string;
  email?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface UserManagementSectionProps {
  users: User[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onToggleRole: (user: User) => void;
  canDemoteUser: (user: User) => boolean;
  isSuperAdmin: boolean;
}

const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  users,
  isLoading,
  searchTerm,
  onSearchChange,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  onToggleRole,
  canDemoteUser,
  isSuperAdmin,
}) => {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          User Management
        </h2>
      </div>

      {/* User Search */}
      <Input
        type="text"
        placeholder="Search users by name or email..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary"></div>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          description="Try adjusting your search criteria"
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <UserTable
            users={users}
            onToggleRole={onToggleRole}
            canDemoteUser={canDemoteUser}
            isSuperAdmin={isSuperAdmin}
          />

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onToggleRole={onToggleRole}
                canDemoteUser={canDemoteUser}
                isSuperAdmin={isSuperAdmin}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage + 1}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => onPageChange(page - 1)}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </>
      )}
    </section>
  );
};

export default UserManagementSection;
