import { useEffect, useRef } from "react";

interface PerformanceMonitorOptions {
  /** Component name for logging */
  componentName: string;
  /** Threshold for warnings (renders per minute) */
  threshold?: number;
  /** Enable monitoring (defaults to development mode only) */
  enabled?: boolean;
}

/**
 * usePerformanceMonitor - Development-only hook to monitor re-render frequency
 * 
 * Logs components that re-render more than the threshold per minute.
 * Helps identify future performance regressions.
 * 
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceMonitor({ componentName: 'MyComponent', threshold: 10 });
 *   // ... rest of component
 * }
 * ```
 */
export function usePerformanceMonitor({
  componentName,
  threshold = 10,
  enabled = import.meta.env.DEV,
}: PerformanceMonitorOptions): void {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  const lastWarningTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime.current) / 60000;

    // Only warn once per minute to avoid console spam
    if (elapsedMinutes >= 1 && currentTime - lastWarningTime.current > 60000) {
      const rendersPerMinute = renderCount.current / elapsedMinutes;

      if (rendersPerMinute > threshold) {
        console.warn(
          `⚠️ Performance Warning: ${componentName} rendered ${renderCount.current} times in ${elapsedMinutes.toFixed(
            2
          )} minutes (${rendersPerMinute.toFixed(1)} renders/min). Threshold: ${threshold} renders/min.`
        );
        lastWarningTime.current = currentTime;
      }

      // Reset counters every 5 minutes
      if (elapsedMinutes >= 5) {
        renderCount.current = 0;
        startTime.current = currentTime;
      }
    }
  });

  // Mark component mount
  useEffect(() => {
    if (!enabled) return;

    performance.mark(`${componentName}-mount`);

    return () => {
      // Mark component unmount
      performance.mark(`${componentName}-unmount`);
      try {
        performance.measure(
          `${componentName}-lifetime`,
          `${componentName}-mount`,
          `${componentName}-unmount`
        );
      } catch {
        // Marks might not exist if component unmounted immediately
      }
    };
  }, [componentName, enabled]);
}
