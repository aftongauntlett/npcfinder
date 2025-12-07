import React from "react";
import { useGlobalError } from "@/hooks/useGlobalError";
import { Alert } from "@/components/shared";
import Toast from "@/components/ui/Toast";

/**
 * GlobalErrorNotifications Component
 *
 * Renders error notifications from the global error store.
 * Uses Toast for transient errors and Alert for persistent ones.
 */
const GlobalErrorNotifications: React.FC = () => {
  const { errors, removeError } = useGlobalError();

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {errors.map((error) =>
        error.persistent ? (
          <Alert
            key={error.id}
            type="error"
            title="Error"
            className="shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex-1">{error.message}</p>
              <button
                onClick={() => removeError(error.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          </Alert>
        ) : (
          <Toast
            key={error.id}
            message={error.message}
            onClose={() => removeError(error.id)}
            duration={error.duration}
          />
        )
      )}
    </div>
  );
};

export default GlobalErrorNotifications;
