import {
  DB_SETUP_ERROR_INDICATORS,
  DB_SETUP_ERROR_CODES,
} from "./suggestionConstants";

/**
 * Error object with optional Supabase properties
 */
interface SupabaseError {
  message?: string;
  code?: string;
}

/**
 * Check if an error indicates the database needs setup
 * @param error - The error object from Supabase
 * @returns True if this is a setup-related error
 */
export function isSetupError(error: unknown): boolean {
  if (!error) return false;

  const supabaseError = error as SupabaseError;
  const errorMessage = supabaseError.message?.toLowerCase() || "";
  const errorCode = supabaseError.code;

  // Check error message for keywords
  const hasSetupKeyword = DB_SETUP_ERROR_INDICATORS.some((keyword) =>
    errorMessage.includes(keyword.toLowerCase())
  );

  // Check error code
  const hasSetupCode = errorCode
    ? DB_SETUP_ERROR_CODES.includes(errorCode)
    : false;

  return hasSetupKeyword || hasSetupCode;
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
