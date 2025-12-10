/**
 * Typed error system for consistent error handling across the application
 * 
 * This module defines discriminated union types for different error categories,
 * enabling type-safe error handling and proper RLS (Row Level Security) error detection.
 */

/**
 * Base error interface with common properties
 */
interface BaseAppError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Authentication errors (session expired, invalid token, etc.)
 */
export interface AuthError extends BaseAppError {
  type: 'auth';
  shouldRedirectToLogin: boolean;
}

/**
 * Authorization/Permission errors (RLS policy violations, insufficient privileges)
 */
export interface ForbiddenError extends BaseAppError {
  type: 'forbidden';
  resource?: string; // e.g., 'board', 'task', 'user_profile'
  action?: string; // e.g., 'read', 'update', 'delete'
}

/**
 * Validation errors (constraint violations, invalid input)
 */
export interface ValidationError extends BaseAppError {
  type: 'validation';
  field?: string;
  constraint?: string; // e.g., 'unique', 'not_null', 'foreign_key'
}

/**
 * Network/Timeout errors (connection issues, timeouts)
 */
export interface NetworkError extends BaseAppError {
  type: 'network';
  shouldRetry: boolean;
}

/**
 * Not found errors (resource doesn't exist)
 */
export interface NotFoundError extends BaseAppError {
  type: 'not_found';
  resource?: string;
}

/**
 * Database setup errors (missing tables, columns, etc.)
 */
export interface SetupError extends BaseAppError {
  type: 'setup';
}

/**
 * Generic/Unknown errors (fallback for unclassified errors)
 */
export interface UnknownError extends BaseAppError {
  type: 'unknown';
}

/**
 * Discriminated union of all error types
 */
export type AppError =
  | AuthError
  | ForbiddenError
  | ValidationError
  | NetworkError
  | NotFoundError
  | SetupError
  | UnknownError;

/**
 * Service response type with discriminated union
 * Used by service layer functions to return either data or a typed error
 */
export type ServiceResult<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: AppError };

/**
 * Type guard to check if a ServiceResult is successful
 */
export function isSuccess<T>(result: ServiceResult<T>): result is { success: true; data: T; error: null } {
  return result.success === true;
}

/**
 * Type guard to check if a ServiceResult has an error
 */
export function isError<T>(result: ServiceResult<T>): result is { success: false; data: null; error: AppError } {
  return result.success === false;
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: AppError): error is AuthError {
  return error.type === 'auth';
}

/**
 * Type guard to check if an error is a ForbiddenError (RLS)
 */
export function isForbiddenError(error: AppError): error is ForbiddenError {
  return error.type === 'forbidden';
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: AppError): error is ValidationError {
  return error.type === 'validation';
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: AppError): error is NetworkError {
  return error.type === 'network';
}

/**
 * Type guard to check if an error is a NotFoundError
 */
export function isNotFoundError(error: AppError): error is NotFoundError {
  return error.type === 'not_found';
}

/**
 * Type guard to check if an error is a SetupError
 */
export function isSetupError(error: AppError): error is SetupError {
  return error.type === 'setup';
}
