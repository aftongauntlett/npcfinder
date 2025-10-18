import React, { createContext, useContext, useState, useEffect } from "react";
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

  const checkAdminStatus = async () => {
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
  };

  const refreshAdminStatus = async () => {
    await checkAdminStatus();
  };

  useEffect(() => {
    void checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, refreshAdminStatus }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
