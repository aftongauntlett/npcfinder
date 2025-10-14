import { supabase } from "./supabase";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { validateInviteCode, consumeInviteCode } from "./inviteCodes";

/**
 * Authentication utilities
 * Handles user sign up, sign in, sign out, and session management
 * Now with invite-only security
 */

interface AuthResult<T> {
  data: T | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with invite code validation
 * SECURITY: Requires valid invite code for registration
 */
export const signUp = async (
  email: string,
  password: string,
  inviteCode: string
): Promise<AuthResult<User>> => {
  try {
    // Step 1: Validate invite code BEFORE creating account
    const { data: isValid, error: validateError } = await validateInviteCode(
      inviteCode
    );

    if (validateError || !isValid) {
      const error = new Error("Invalid or expired invite code") as AuthError;
      error.name = "InviteCodeError";
      throw error;
    }

    // Step 2: Create the user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("User creation failed");

    // Step 3: Consume the invite code (mark as used)
    const { error: consumeError } = await consumeInviteCode(
      inviteCode,
      data.user.id
    );

    if (consumeError) {
      console.error("Failed to consume invite code:", consumeError);
      // Note: User is already created at this point
      // Consider implementing cleanup if this is critical
    }

    return { data: data.user, error: null };
  } catch (error) {
    console.error("Sign up error:", error);
    return { data: null, error: error as AuthError };
  }
};

/**
 * Sign in existing user
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult<Session>> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data: data.session, error: null };
  } catch (error) {
    console.error("Sign in error:", error);
    return { data: null, error: error as AuthError };
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: error as AuthError };
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async (): Promise<AuthResult<User>> => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: user, error: null };
  } catch (error) {
    console.error("Get current user error:", error);
    return { data: null, error: error as AuthError };
  }
};

/**
 * Get current session
 */
export const getSession = async (): Promise<AuthResult<Session>> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: session, error: null };
  } catch (error) {
    console.error("Get session error:", error);
    return { data: null, error: error as AuthError };
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};
