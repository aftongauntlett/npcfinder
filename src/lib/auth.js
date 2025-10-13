import { supabase } from "./supabase";

/**
 * Authentication utilities
 * Handles user sign up, sign in, sign out, and session management
 */

/**
 * Sign up a new user
 */
export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Sign up error:", error);
    return { data: null, error };
  }
};

/**
 * Sign in existing user
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Sign in error:", error);
    return { data: null, error };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error };
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error("Get current user error:", error);
    return { user: null, error };
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error("Get session error:", error);
    return { session: null, error };
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
