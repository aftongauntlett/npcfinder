import React from "react";
import { Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useAdmin } from "../../contexts/AdminContext";

interface ProtectedAdminRouteProps {
  user: User;
  children: React.ReactNode;
}

/**
 * Route guard for admin-only pages
 * Checks admin status and redirects or shows loading/access denied states
 */
const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  user,
  children,
}) => {
  const { isAdmin, isLoading } = useAdmin();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Access Denied - Admin Only</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
