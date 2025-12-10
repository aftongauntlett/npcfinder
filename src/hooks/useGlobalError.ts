import { create } from "zustand";
import { parseSupabaseError } from "@/utils/errorUtils";
import type { AppError } from "@/types/errors";
import { logger } from "@/lib/logger";

/**
 * Error notification type
 */
export interface ErrorNotification {
  id: string;
  message: string;
  persistent: boolean;
  duration: number;
  timestamp: number;
}

/**
 * Global error state
 */
interface GlobalErrorState {
  errors: ErrorNotification[];
  addError: (
    message: string,
    options?: { duration?: number; persistent?: boolean }
  ) => void;
  removeError: (id: string) => void;
  clearAll: () => void;
}

/**
 * Maximum number of simultaneous error notifications
 */
const MAX_ERRORS = 3;

/**
 * Default duration for non-persistent errors (5 seconds)
 */
const DEFAULT_DURATION = 5000;

/**
 * Global error store using Zustand
 * Exported separately from the hook to allow non-React usage (e.g., in main.tsx)
 */
export const globalErrorStore = create<GlobalErrorState>((set, get) => {
  // Map to track timeout IDs for each error
  const timeoutMap = new Map<string, NodeJS.Timeout>();

  return {
    errors: [],

    addError: (message, options = {}) => {
      const { duration = DEFAULT_DURATION, persistent = false } = options;

      const id = `error-${Date.now()}-${Math.random()}`;
      const newError: ErrorNotification = {
        id,
        message,
        persistent,
        duration,
        timestamp: Date.now(),
      };

      set((state) => {
        // Limit to MAX_ERRORS, remove oldest non-persistent
        const errors = [...state.errors];
        if (errors.length >= MAX_ERRORS) {
          const nonPersistentIndex = errors.findIndex((e) => !e.persistent);
          if (nonPersistentIndex >= 0) {
            errors.splice(nonPersistentIndex, 1);
          } else {
            // All persistent, remove oldest
            errors.shift();
          }
        }

        return { errors: [...errors, newError] };
      });

      // Auto-dismiss non-persistent errors
      if (!persistent) {
        const timeoutId = setTimeout(() => {
          // Remove the timeout ID from map after firing
          timeoutMap.delete(id);
          get().removeError(id);
        }, duration);

        // Store the timeout ID in the map
        timeoutMap.set(id, timeoutId);
      }

      // Log to Sentry/logger
      logger.error("Global error notification", { message, persistent, id });
    },

    removeError: (id) => {
      // Clear the timeout if it exists
      const timeoutId = timeoutMap.get(id);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutMap.delete(id);
      }

      set((state) => ({
        errors: state.errors.filter((e) => e.id !== id),
      }));
    },

    clearAll: () => {
      // Clear all pending timeouts
      timeoutMap.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutMap.clear();

      set({ errors: [] });
    },
  };
});

/**
 * Global error notification hook
 *
 * Provides methods to show and manage error notifications.
 * Automatically parses Supabase errors into friendly messages.
 */
export function useGlobalError() {
  const { errors, addError, removeError, clearAll } = globalErrorStore();

  /**
   * Show error notification
   * @param error - Error object, AppError, or message string
   * @param options - Notification options
   */
  const showError = (
    error: unknown,
    options: { duration?: number; persistent?: boolean } = {}
  ) => {
    let message: string;
    let shouldLog = true;

    if (typeof error === "string") {
      message = error;
    } else if (error && typeof error === "object" && "type" in error) {
      // Handle typed AppError
      const appError = error as AppError;
      message = appError.message;
      
      // Log with full error context
      logger.error("Global error notification (typed)", {
        type: appError.type,
        message: appError.message,
        code: appError.code,
        details: appError.details,
      });
      shouldLog = false; // Already logged above
    } else {
      // Parse unknown errors through our error parser
      const parsed = parseSupabaseError(error);
      message = parsed.message;
      
      // Log with full parsed context
      logger.error("Global error notification (parsed)", {
        type: parsed.type,
        message: parsed.message,
        code: parsed.code,
        details: parsed.details,
      });
      shouldLog = false; // Already logged above
    }

    addError(message, options);
    
    // Log if we haven't already
    if (shouldLog) {
      logger.error("Global error notification", { message });
    }
  };

  /**
   * Show success notification (uses Toast internally)
   * @param message - Success message
   * @param options - Notification options
   */
  const showSuccess = (
    message: string,
    _options: { duration?: number } = {}
  ) => {
    // Success notifications are handled by a separate Toast component
    // This is a placeholder for consistency
    logger.info("Success notification", { message });
  };

  return {
    errors,
    showError,
    showSuccess,
    removeError,
    clearAll,
  };
}
