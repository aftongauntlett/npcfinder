import { supabase } from "./supabase";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { validateInviteCode, consumeInviteCode } from "./inviteCodes";
import { logger } from "@/lib/logger";
import { signInRateLimiter, signUpRateLimiter } from "@/utils/rateLimiter";

/**
 * Authentication utilities
 * Handles user sign up, sign in, sign out, and session management
 * Now with invite-only security and rate limiting
 */

interface AuthResult<T> {
  data: T | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with invite code validation
 * SECURITY: Requires valid invite code for registration
 * SECURITY: Server-side rate limited to prevent abuse (3 attempts per hour per email)
 * SECURITY: Client-side rate limiter provides UX optimization only
 */
export const signUp = async (
  email: string,
  password: string,
  inviteCode: string
): Promise<AuthResult<User>> => {
  try {
    // SECURITY: Check server-side rate limit first (authoritative)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
      "check_signup_rate_limit",
      { user_email: email }
    );

    if (rateLimitError) {
      logger.error("Server-side rate limit check failed", {
        error: rateLimitError,
      });
      // Fall back to client-side check if server check fails
    } else if (rateLimitCheck && !rateLimitCheck.allowed) {
      const error = new Error(
        rateLimitCheck.error ||
          "Too many signup attempts. Please try again later."
      ) as AuthError;
      error.name = "RateLimitError";
      throw error;
    }

    // Client-side rate limiter (UX optimization - shows remaining attempts)
    const rateLimitKey = `signup:${email.toLowerCase()}`;
    if (!signUpRateLimiter.checkLimit(rateLimitKey)) {
      const error = new Error(
        "Too many signup attempts. Please try again later."
      ) as AuthError;
      error.name = "RateLimitError";
      throw error;
    }

    // Step 1: Validate invite code BEFORE creating account
    // Now includes email validation for extra security
    const { data: isValid, error: validateError } = await validateInviteCode(
      inviteCode,
      email
    );

    if (validateError || !isValid) {
      const error = new Error(
        "Invalid invite code or email does not match the intended recipient"
      ) as AuthError;
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
      logger.error("Failed to consume invite code", {
        error: consumeError,
        inviteCode,
      });
      // Note: User is already created at this point
      // The code should still be marked as used via database trigger
    }

    // SECURITY: Reset rate limits on successful signup (both server and client)
    try {
      await supabase.rpc("reset_auth_rate_limit", {
        user_email: email,
        auth_type: "signup",
      });
    } catch (resetError) {
      logger.warn("Failed to reset server-side rate limit", {
        error: resetError,
      });
    }
    signUpRateLimiter.reset(rateLimitKey);

    return { data: data.user, error: null };
  } catch (error) {
    logger.error("Sign up failed", { error, email });
    return { data: null, error: error as AuthError };
  }
};

/**
 * Sign in existing user
 * SECURITY: Server-side rate limited to prevent brute force (5 attempts per 15 minutes per email)
 * SECURITY: Client-side rate limiter provides UX optimization only
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult<Session>> => {
  try {
    // SECURITY: Check server-side rate limit first (authoritative)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
      "check_signin_rate_limit",
      { user_email: email }
    );

    if (rateLimitError) {
      logger.error("Server-side rate limit check failed", {
        error: rateLimitError,
      });
      // Fall back to client-side check if server check fails
    } else if (rateLimitCheck && !rateLimitCheck.allowed) {
      const error = new Error(
        rateLimitCheck.error ||
          "Too many login attempts. Please try again in 15 minutes."
      ) as AuthError;
      error.name = "RateLimitError";
      throw error;
    }

    // Client-side rate limiter (UX optimization - shows remaining attempts)
    const rateLimitKey = `signin:${email.toLowerCase()}`;
    if (!signInRateLimiter.checkLimit(rateLimitKey)) {
      const error = new Error(
        "Too many login attempts. Please try again in 15 minutes."
      ) as AuthError;
      error.name = "RateLimitError";
      throw error;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // SECURITY: Reset rate limits on successful login (both server and client)
    try {
      await supabase.rpc("reset_auth_rate_limit", {
        user_email: email,
        auth_type: "signin",
      });
    } catch (resetError) {
      logger.warn("Failed to reset server-side rate limit", {
        error: resetError,
      });
    }
    signInRateLimiter.reset(rateLimitKey);

    return { data: data.session, error: null };
  } catch (error) {
    logger.error("Sign in failed", { error, email });
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
    logger.error("Sign out failed", { error });
    return { error: error as AuthError };
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async (): Promise<AuthResult<User>> => {
  try {
    // Check if Supabase is configured before attempting to access it
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Not an error - just means we're on a public page without Supabase
      return { data: null, error: null };
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: user, error: null };
  } catch (error) {
    logger.error("Failed to get current user", { error });
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
    logger.error("Failed to get session", { error });
    return { data: null, error: error as AuthError };
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  // Check if Supabase is configured before setting up listener
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return a no-op subscription for public pages
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange(callback);
};
