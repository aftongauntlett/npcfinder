import React, { createContext, useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { getCurrentUser, onAuthStateChange } from "../lib/auth";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkUser();

    // Listen for auth changes
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error checking user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
