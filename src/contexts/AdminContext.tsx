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
  // SECURITY: Admin status determined ONLY by database, no fallback to environment variables
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
          .maybeSingle();

        if (error) {
          // SECURITY: Fail closed - if database check fails, treat as non-admin
          logger.error("Admin check query failed", {
            code: error.code,
            userId: user.id,
          });
          return false;
        }

        // If no profile exists yet, treat as non-admin (fail closed)
        return data?.is_admin || false;
      } catch (error) {
        // SECURITY: Fail closed on any error
        logger.error("Failed to check admin status, treating as non-admin", {
          error,
          userId: user?.id,
        });
        return false;
      }
    },
    enabled: !!user, // Only run query when user exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2, // Retry failed queries up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
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
