/**
 * Database setup error indicators and codes
 */
const DB_SETUP_ERROR_INDICATORS = [
  "relation",
  "does not exist",
  "table",
  "column",
  "permission denied",
];

const DB_SETUP_ERROR_CODES = ["42P01", "42703"];

/**
 * Error object with optional Supabase properties
 */
interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

import type { AppError } from '@/types/errors';

/**
 * Error severity levels
 */
export type ErrorSeverity = "critical" | "high" | "medium" | "low";

/**
 * Legacy ParsedError type for backward compatibility
 * @deprecated Use AppError instead
 */
export interface ParsedError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  isAuth: boolean;
  shouldRetry: boolean;
}

/**
 * Supabase error code to user-friendly message mapping
 */
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  // Unique violation
  "23505": "This item already exists",
  // Foreign key violation
  "23503": "Cannot perform this action due to related data",
  // Not null violation
  "23502": "Required information is missing",
  // Check violation
  "23514": "Invalid data provided",
  // Session/Auth errors
  PGRST301: "Your session has expired. Please log in again",
  PGRST204: "No data found",
  // JWT errors
  PGRST302: "Invalid authentication token",
  // Permission errors
  "42501": "You don't have permission to perform this action",
};

/**
 * Network and timeout error patterns
 */
const NETWORK_ERROR_PATTERNS = [
  "network",
  "fetch",
  "timeout",
  "connection",
  "ECONNREFUSED",
  "ETIMEDOUT",
];

/**
 * Auth error patterns
 */
const AUTH_ERROR_PATTERNS = [
  "session",
  "jwt",
  "token",
  "authentication",
  "unauthorized",
  "PGRST301",
  "PGRST302",
];

/**
 * RLS/Permission error patterns
 */
const RLS_ERROR_PATTERNS = [
  "policy",
  "row level security",
  "rls",
  "permission denied",
  "insufficient privilege",
];

/**
 * Parse Supabase error into typed AppError
 * @param error - The error object from Supabase
 * @returns Typed AppError with discriminated union
 */
export function parseSupabaseError(error: unknown): AppError {
  if (!error) {
    return {
      type: 'unknown',
      message: "An unknown error occurred",
    };
  }

  const supabaseError = error as SupabaseError;
  const errorCode = supabaseError.code;
  const errorMessage = supabaseError.message?.toLowerCase() || "";

  // Check for auth errors
  if (isAuthErrorRaw(error)) {
    return {
      type: 'auth',
      message: SUPABASE_ERROR_MESSAGES[errorCode || ""] || "Your session has expired. Please log in again",
      code: errorCode,
      details: supabaseError.details,
      hint: supabaseError.hint,
      shouldRedirectToLogin: true,
    };
  }

  // Check for RLS/Permission errors
  if (errorCode === "42501" || RLS_ERROR_PATTERNS.some(pattern => errorMessage.includes(pattern))) {
    return {
      type: 'forbidden',
      message: SUPABASE_ERROR_MESSAGES[errorCode || ""] || "You don't have permission to perform this action",
      code: errorCode,
      details: supabaseError.details,
      hint: supabaseError.hint,
    };
  }

  // Check for validation/constraint errors
  if (errorCode?.startsWith("23")) {
    let constraint: string | undefined;
    if (errorCode === "23505") constraint = "unique";
    else if (errorCode === "23503") constraint = "foreign_key";
    else if (errorCode === "23502") constraint = "not_null";
    else if (errorCode === "23514") constraint = "check";

    return {
      type: 'validation',
      message: SUPABASE_ERROR_MESSAGES[errorCode] || "Invalid data provided",
      code: errorCode,
      details: supabaseError.details,
      hint: supabaseError.hint,
      constraint,
    };
  }

  // Check for not found errors
  if (errorCode === "PGRST204" || errorMessage.includes("not found")) {
    return {
      type: 'not_found',
      message: "The requested resource was not found",
      code: errorCode,
      details: supabaseError.details,
    };
  }

  // Check for network errors
  if (NETWORK_ERROR_PATTERNS.some(pattern => errorMessage.includes(pattern))) {
    return {
      type: 'network',
      message: "Network error occurred. Please check your connection and try again",
      code: errorCode,
      details: supabaseError.details,
      shouldRetry: true,
    };
  }

  // Check for setup errors
  if (isSetupErrorRaw(error)) {
    return {
      type: 'setup',
      message: "Database setup required",
      code: errorCode,
      details: supabaseError.details,
      hint: supabaseError.hint,
    };
  }

  // Fallback to unknown error
  return {
    type: 'unknown',
    message: supabaseError.message || "An error occurred",
    code: errorCode,
    details: supabaseError.details,
    hint: supabaseError.hint,
  };
}

/**
 * Parse Supabase error into legacy format
 * @deprecated Use parseSupabaseError instead, which returns AppError
 */
export function parseSupabaseErrorLegacy(error: unknown): ParsedError {
  if (!error) {
    return {
      message: "An unknown error occurred",
      severity: "medium",
      isAuth: false,
      shouldRetry: false,
    };
  }

  const supabaseError = error as SupabaseError;
  const errorCode = supabaseError.code;

  // Check for known error codes
  let friendlyMessage =
    (errorCode && SUPABASE_ERROR_MESSAGES[errorCode]) ||
    supabaseError.message ||
    "An error occurred";

  // Determine if auth error
  const isAuth = isAuthErrorRaw(error);

  // Determine if should retry
  const shouldRetry = shouldRetryError(error);

  // Determine severity
  const severity = getErrorSeverity(error);

  // Override message for auth errors
  if (isAuth && !SUPABASE_ERROR_MESSAGES[errorCode || ""]) {
    friendlyMessage = "Your session has expired. Please log in again";
  }

  return {
    message: friendlyMessage,
    code: errorCode,
    severity,
    isAuth,
    shouldRetry,
  };
}

/**
 * Get error severity level
 * @param error - The error object
 * @returns Severity level
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (!error) return "low";

  const supabaseError = error as SupabaseError;
  const errorCode = supabaseError.code;
  const errorMessage = supabaseError.message?.toLowerCase() || "";

  // Critical: Auth, permission, or data integrity errors
  if (
    errorCode === "PGRST301" ||
    errorCode === "PGRST302" ||
    errorCode === "42501" ||
    errorCode === "23505"
  ) {
    return "critical";
  }

  // High: Constraint violations
  if (errorCode === "23503" || errorCode === "23502" || errorCode === "23514") {
    return "high";
  }

  // Medium: Network or temporary issues
  if (
    NETWORK_ERROR_PATTERNS.some((pattern) => errorMessage.includes(pattern))
  ) {
    return "medium";
  }

  // Low: Generic or unknown errors
  return "low";
}

/**
 * Check if error is authentication-related (raw check for internal use)
 * @param error - The error object
 * @returns True if auth error
 */
function isAuthErrorRaw(error: unknown): boolean {
  if (!error) return false;

  const supabaseError = error as SupabaseError;
  const errorMessage = supabaseError.message?.toLowerCase() || "";
  const errorCode = supabaseError.code;

  return AUTH_ERROR_PATTERNS.some(
    (pattern) =>
      errorMessage.includes(pattern.toLowerCase()) || errorCode === pattern
  );
}

/**
 * Check if error is authentication-related
 * @deprecated Use parseSupabaseError and check error.type === 'auth' instead
 * @param error - The error object
 * @returns True if auth error
 */
export function isAuthError(error: unknown): boolean {
  return isAuthErrorRaw(error);
}

/**
 * Determine if error should trigger retry
 * @param error - The error object
 * @returns True if should retry
 */
export function shouldRetryError(error: unknown): boolean {
  if (!error) return false;

  const supabaseError = error as SupabaseError;
  const errorMessage = supabaseError.message?.toLowerCase() || "";
  const errorCode = supabaseError.code;

  // Don't retry auth errors
  if (isAuthError(error)) return false;

  // Don't retry validation/constraint errors
  if (
    errorCode?.startsWith("23") || // Constraint violations
    errorCode === "42501" || // Permission denied
    errorCode === "PGRST204" // No data
  ) {
    return false;
  }

  // Retry network/timeout errors
  if (
    NETWORK_ERROR_PATTERNS.some((pattern) => errorMessage.includes(pattern))
  ) {
    return true;
  }

  // Default: no retry for unknown errors
  return false;
}

/**
 * Check if an error indicates the database needs setup (raw check for internal use)
 * @param error - The error object from Supabase
 * @returns True if this is a setup-related error
 */
function isSetupErrorRaw(error: unknown): boolean {
  if (!error) return false;

  const supabaseError = error as SupabaseError;
  const errorMessage = supabaseError.message?.toLowerCase() || "";
  const errorCode = supabaseError.code;

  // Check error message for keywords
  const hasSetupKeyword = DB_SETUP_ERROR_INDICATORS.some((keyword: string) =>
    errorMessage.includes(keyword.toLowerCase())
  );

  // Check error code
  const hasSetupCode = errorCode
    ? DB_SETUP_ERROR_CODES.includes(errorCode)
    : false;

  return hasSetupKeyword || hasSetupCode;
}

/**
 * Check if an error indicates the database needs setup
 * @deprecated Use parseSupabaseError and check error.type === 'setup' instead
 * @param error - The error object from Supabase
 * @returns True if this is a setup-related error
 */
export function isSetupError(error: unknown): boolean {
  return isSetupErrorRaw(error);
}

/**
 * Get a user-friendly error message
 * @param error - The error object
 * @param defaultMessage - Default message if not a setup error
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = "An error occurred"
): string {
  if (isSetupError(error)) {
    return "Database setup required";
  }

  const supabaseError = error as SupabaseError;
  return supabaseError?.message || defaultMessage;
}
