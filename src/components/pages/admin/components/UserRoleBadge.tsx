import React from "react";
import { Shield, ShieldCheck, User } from "lucide-react";
import Button from "../../../shared/ui/Button";
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
  if (role === "super_admin") {
    return (
      <Button
        disabled
        variant="primary"
        size="sm"
        className="!bg-gradient-to-r !from-yellow-500 !to-amber-600 !text-white hover:!from-yellow-600 hover:!to-amber-700 cursor-not-allowed"
        aria-label="Super Admin - cannot be demoted"
        title="Super Admin - cannot be demoted"
        icon={<Shield className="w-3.5 h-3.5" aria-hidden="true" />}
      >
        Super Admin
      </Button>
    );
  }

  if (role === "admin") {
    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="primary"
        size="sm"
        className={`!bg-gradient-to-r !from-green-500 !to-emerald-600 !text-white hover:!from-green-600 hover:!to-emerald-700 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
        aria-label={disabledReason || "Click to remove admin privileges"}
        title={disabledReason || "Click to remove admin privileges"}
        icon={<ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />}
      >
        Admin
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="primary"
      size="sm"
      aria-label="Click to make admin"
      title="Click to make admin"
      icon={<User className="w-3.5 h-3.5" aria-hidden="true" />}
    >
      User
    </Button>
  );
};

export default UserRoleBadge;
