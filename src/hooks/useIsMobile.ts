/**
 * useIsMobile Hook
 *
 * Detects mobile viewport using window.matchMedia
 */

import { useState, useEffect } from "react";

/**
 * Hook to detect mobile viewport (max-width: 768px)
 * Returns true on mobile, false on desktop
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }

    return undefined;
  }, []);

  return isMobile;
};
