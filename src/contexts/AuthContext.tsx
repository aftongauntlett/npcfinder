import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, onAuthStateChange } from "../lib/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    void checkUser();

    const { data: authListener } = onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      const userChanged = user?.id !== newUser?.id;

      // Clear all cached queries when user changes (logout, login, or account switch)
      if (userChanged && !loading) {
        queryClient.clear();
      }

      setUser(newUser);
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [user?.id, loading, queryClient]);

  const checkUser = async () => {
    try {
      const { data: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch {
      // Gracefully handle missing Supabase on public pages
      console.log("Auth check skipped (likely on public page)");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
