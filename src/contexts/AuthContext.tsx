import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
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
  const previousUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Check initial user state
    const checkInitialUser = async () => {
      try {
        const { data: currentUser } = await getCurrentUser();
        setUser(currentUser);
        previousUserIdRef.current = currentUser?.id;
      } catch {
        // Gracefully handle missing Supabase on public pages
        setUser(null);
        previousUserIdRef.current = undefined;
      } finally {
        setLoading(false);
      }
    };

    void checkInitialUser();

    const { data: authListener } = onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      const newUserId = newUser?.id;
      const userChanged = previousUserIdRef.current !== newUserId;

      // Clear all cached queries when user changes (logout, login, or account switch)
      if (userChanged) {
        queryClient.clear();
      }

      previousUserIdRef.current = newUserId;
      setUser(newUser);
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      loading,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
