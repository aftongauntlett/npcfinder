import { create } from "zustand";
import { parseSupabaseError } from "@/utils/errorUtils";
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
export const globalErrorStore = create<GlobalErrorState>((set, get) => ({
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
      setTimeout(() => {
        get().removeError(id);
      }, duration);
    }

    // Log to Sentry/logger
    logger.error("Global error notification", { message, persistent, id });
  },

  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }));
  },

  clearAll: () => {
    set({ errors: [] });
  },
}));

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
   * @param error - Error object or message string
   * @param options - Notification options
   */
  const showError = (
    error: unknown,
    options: { duration?: number; persistent?: boolean } = {}
  ) => {
    let message: string;

    if (typeof error === "string") {
      message = error;
    } else {
      const parsed = parseSupabaseError(error);
      message = parsed.message;
    }

    addError(message, options);
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
