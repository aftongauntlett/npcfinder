import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Check database first
      const { data, error } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      } else {
        // Fallback to environment variable only if database fails
        const adminUserId = import.meta.env.VITE_ADMIN_USER_ID;
        const fallbackIsAdmin =
          adminUserId &&
          adminUserId !== "your_user_id_here" &&
          user.id === adminUserId;

        setIsAdmin(fallbackIsAdmin || false);

        if (error) {
          console.warn("Failed to check admin status from database:", error);
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshAdminStatus = useCallback(async () => {
    await checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    void checkAdminStatus();
  }, [checkAdminStatus]);

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
