import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { logger } from "@/lib/logger";
import { parseSupabaseError } from "@/utils/errorUtils";

export type UserRole = "user" | "admin" | "super_admin";

interface AdminContextType {
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

/**
 * AdminProvider with TanStack Query
 * Prevents duplicate queries by caching role status check
 */
export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use TanStack Query to check role status (cached, deduplicated)
  // SECURITY: Role determined ONLY by database, no fallback to environment variables
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // Check database for role
        const { data, error } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          // SECURITY: Fail closed - if database check fails, treat as non-admin
          // Parse the error for proper logging and categorization
          const parsedError = parseSupabaseError(error);
          logger.error("Role check query failed", {
            code: parsedError.code,
            type: parsedError.type,
            userId: user.id,
          });
          
          // For RLS/permission errors, fail closed silently
          // For other errors, allow retry by throwing
          if (parsedError.type === 'forbidden' || parsedError.type === 'auth') {
            return null;
          }
          
          throw parsedError;
        }

        // If no profile exists yet, treat as regular user (fail closed)
        return data;
      } catch (error) {
        // SECURITY: Fail closed on any error
        const parsedError = parseSupabaseError(error);
        logger.error("Failed to check user role, treating as regular user", {
          error: parsedError,
          userId: user?.id,
        });
        
        // Only throw for network errors that should retry
        if (parsedError.type === 'network') {
          throw parsedError;
        }
        
        return null;
      }
    },
    enabled: !!user, // Only run query when user exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2, // Retry failed queries up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  const role: UserRole = (profile?.role as UserRole) || "user";
  const isAdmin = ["admin", "super_admin"].includes(role);
  const isSuperAdmin = role === "super_admin";

  // Function to manually refresh role status (e.g., after toggling admin)
  const refreshAdminStatus = useMemo(
    () => async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user-role", user?.id],
      });
    },
    [queryClient, user?.id]
  );

  const value = useMemo(
    () => ({ role, isAdmin, isSuperAdmin, isLoading, refreshAdminStatus }),
    [role, isAdmin, isSuperAdmin, isLoading, refreshAdminStatus]
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
