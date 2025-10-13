import {
  DB_SETUP_ERROR_INDICATORS,
  DB_SETUP_ERROR_CODES,
} from "./suggestionConstants";

/**
 * Check if an error indicates the database needs setup
 * @param {Error} error - The error object from Supabase
 * @returns {boolean} - True if this is a setup-related error
 */
export function isSetupError(error) {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code;

  // Check error message for keywords
  const hasSetupKeyword = DB_SETUP_ERROR_INDICATORS.some((keyword) =>
    errorMessage.includes(keyword.toLowerCase())
  );

  // Check error code
  const hasSetupCode = DB_SETUP_ERROR_CODES.includes(errorCode);

  return hasSetupKeyword || hasSetupCode;
}

/**
 * Get a user-friendly error message
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message if not a setup error
 * @returns {string} - User-friendly error message
 */
export function getErrorMessage(error, defaultMessage = "An error occurred") {
  if (isSetupError(error)) {
    return "Database setup required";
  }

  return error?.message || defaultMessage;
}
