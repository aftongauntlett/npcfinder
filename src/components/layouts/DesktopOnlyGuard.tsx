import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * DesktopOnlyGuard
 *
 * Shows a friendly message for screens below 768px (tablets/phones).
 * Allows the app to work on laptops, small laptops, and Surface Pro devices.
 *
 * Minimum supported: 768px (works on 14" laptops, Surface Pro, iPad landscape)
 *
 * Exemptions: Landing page (/) allows all screen sizes
 */
export function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(true);
  const [screenWidth, setScreenWidth] = useState(0);

  // Landing page is exempt from desktop-only requirement
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsDesktop(width >= 768);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Skip desktop check for landing page
  if (isLandingPage || isDesktop) {
    return <>{children}</>;
  }

  if (!isDesktop) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-gray-900">
        <div className="text-center max-w-md space-y-6">
          {/* Icon */}
          <div className="text-6xl">💻</div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white">Desktop Required</h1>

          {/* Description */}
          <p className="text-lg text-gray-400">
            NPC Finder is optimized for desktop, laptop, and tablet computers.
          </p>

          {/* Technical Details */}
          <div className="text-sm text-gray-500 space-y-2">
            <p>Minimum screen width: 768px</p>
            <p className="text-gray-600">Your screen: {screenWidth}px</p>
          </div>

          {/* Future Message */}
          <div className="pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              📱 Mobile experience coming soon!
            </p>
          </div>

          {/* Suggestions */}
          <div className="text-xs text-gray-600 space-y-1">
            <p>Try:</p>
            <ul className="list-disc list-inside">
              <li>Rotating your tablet to landscape</li>
              <li>Accessing from a laptop or desktop</li>
              <li>Using a larger device</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
