/**
 * Layout constants for sidebar and main content area
 * Keeps sidebar width and main padding in sync across components
 *
 * Note: These constants serve as the single source of truth for layout dimensions.
 * Components use Tailwind arbitrary values (e.g., w-[224px], md:pl-[224px]) directly
 * to ensure Tailwind can detect and include these classes during build-time scanning.
 * Update these values when changing sidebar dimensions across:
 * - src/components/shared/Sidebar.tsx
 * - src/components/layouts/MainLayout.tsx
 * - src/components/shared/Modal.tsx
 */

export const SIDEBAR_WIDTH = {
  /** Collapsed sidebar width in pixels */
  COLLAPSED: 64,
  /** Expanded sidebar width in pixels */
  EXPANDED: 224,
} as const;
