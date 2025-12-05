import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { logger } from "@/lib/logger";

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

/**
 * AdminProvider with TanStack Query
 * Prevents duplicate queries by caching admin status check
 */
export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use TanStack Query to check admin status (cached, deduplicated)
  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin-status", user?.id],
    queryFn: async () => {
      if (!user) return false;

      try {
        // Check database for admin status
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          return data.is_admin || false;
        }

        // Fallback to environment variable only if database fails
        const adminUserId = import.meta.env.VITE_ADMIN_USER_ID;
        const fallbackIsAdmin =
          adminUserId &&
          adminUserId !== "your_user_id_here" &&
          user.id === adminUserId;

        if (error) {
          logger.warn("Failed to check admin status from database", {
            error,
            userId: user.id,
          });
        }

        return fallbackIsAdmin || false;
      } catch (error) {
        logger.error("Failed to check admin status", {
          error,
          userId: user.id,
        });
        return false;
      }
    },
    enabled: !!user, // Only run query when user exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Function to manually refresh admin status (e.g., after toggling admin)
  const refreshAdminStatus = useMemo(
    () => async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-status", user?.id],
      });
    },
    [queryClient, user?.id]
  );

  const value = useMemo(
    () => ({ isAdmin, isLoading, refreshAdminStatus }),
    [isAdmin, isLoading, refreshAdminStatus]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
