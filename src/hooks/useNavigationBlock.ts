/**
 * Custom hook to warn about unsaved changes
 *
 * This is a simplified approach since we're using BrowserRouter.
 * It handles:
 * - Browser close/refresh (beforeunload event)
 * - Manual navigation via provided callback
 *
 * For full navigation blocking (sidebar, back button), we'd need to:
 * 1. Migrate to createBrowserRouter and use useBlocker, OR
 * 2. Intercept all Link clicks globally (complex and fragile)
 *
 * Current approach is pragmatic: warn on close/refresh, require manual
 * confirmation for explicit navigation actions.
 */

import { useEffect } from "react";

interface UseNavigationBlockOptions {
  when: boolean;
  message?: string;
}

export function useNavigationBlock({
  when,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UseNavigationBlockOptions) {
  // Handle browser close/refresh
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [when, message]);
}
