import React from "react";
import { Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useAdmin } from "../../contexts/AdminContext";

interface ProtectedAdminRouteProps {
  user: User;
  children: React.ReactNode;
  requiredRole?: "admin" | "super_admin";
}

/**
 * Route guard for admin-only pages
 * Checks role status and redirects or shows loading/access denied states
 */
const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  user,
  children,
  requiredRole = "admin",
}) => {
  const { role, isLoading } = useAdmin();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Check if user has required role
  const hasAccess =
    requiredRole === "admin"
      ? ["admin", "super_admin"].includes(role)
      : role === "super_admin";

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">
          Access Denied -{" "}
          {requiredRole === "super_admin" ? "Super Admin" : "Admin"} Only
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
