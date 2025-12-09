import React from "react";
import { ChevronDown } from "lucide-react";
import Dropdown from "../../../shared/ui/Dropdown";
import Chip from "../../../shared/ui/Chip";
import type { DropdownOption } from "../../../shared/ui/Dropdown";
import type { UserRole } from "../../../../contexts/AdminContext";

interface UserRoleBadgeProps {
  role: UserRole;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role,
  onClick,
  disabled,
  disabledReason,
}) => {
  // Super admin cannot be changed - show as chip
  if (role === "super_admin") {
    return (
      <Chip variant="warning" size="sm" rounded="full">
        Super Admin
      </Chip>
    );
  }

  // For admin and user, show dropdown to change role
  const options: DropdownOption[] = [
    {
      id: "user",
      label: "User",
    },
    {
      id: "admin",
      label: "Admin",
    },
  ];

  const displayLabel = role === "admin" ? "Admin" : "User";

  const triggerContent = (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {displayLabel}
      <ChevronDown className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
    </div>
  );

  if (disabled) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
        title={disabledReason}
      >
        {displayLabel}
      </span>
    );
  }

  return (
    <Dropdown
      trigger={triggerContent}
      options={options}
      value={role}
      onChange={(value) => {
        if (value !== role && onClick) {
          onClick();
        }
      }}
      size="sm"
      align="right"
    />
  );
};

export default UserRoleBadge;
