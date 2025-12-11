import { useState, useEffect } from "react";

/**
 * useDevToolsDetection - Detects when Chrome DevTools is open (docked mode)
 * 
 * Returns true when DevTools is detected as open, allowing components
 * to pause expensive animations and reduce performance overhead.
 * 
 * Detection method:
 * - Window outer/inner dimension differences (primarily detects docked DevTools)
 * - Checks periodically every 2 seconds and on window resize events
 * 
 * Limitations:
 * - Primarily targets docked DevTools scenarios (side or bottom docked)
 * - May not detect undocked/detached DevTools windows
 * - Detection threshold is 160px difference in either dimension
 * 
 * @returns {boolean} shouldPauseAnimations - True when docked DevTools is detected
 */
export function useDevToolsDetection(): boolean {
  const [shouldPauseAnimations, setShouldPauseAnimations] = useState(false);

  useEffect(() => {
    let devToolsOpen = false;

    // Method 1: Check for dimension differences (DevTools docked)
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const orientation = widthThreshold ? "vertical" : "horizontal";

      if (
        !(heightThreshold && orientation === "horizontal") &&
        !(widthThreshold && orientation === "vertical")
      ) {
        devToolsOpen = false;
      } else {
        devToolsOpen = true;
      }

      setShouldPauseAnimations(devToolsOpen);
    };

    // Method 2: Listen for window resize (DevTools opening/closing)
    const handleResize = () => {
      checkDevTools();
    };

    // Initial check
    checkDevTools();

    // Check periodically (every 2 seconds is sufficient)
    const interval = setInterval(checkDevTools, 2000);

    // Listen for resize events
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return shouldPauseAnimations;
}
