/**
 * Centralized Theme Constants for Landing Page
 *
 * This file defines the color palette and theme utilities for the landing page.
 * All landing page components should import colors from this file to ensure consistency.
 */

// ============================================================================
// Brand Colors (4 Core Colors)
// ============================================================================

/**
 * Primary Peach: Main brand color
 * Used for: CTAs, primary highlights, hero elements, warm accents
 * WCAG AAA compliant on dark backgrounds (10.1:1 contrast ratio)
 */
export const LANDING_PEACH = "#FFB088";

/**
 * Accent Teal: Complementary color for interactive elements
 * Used for: Interactive elements, professional/technical content, links
 */
export const LANDING_TEAL = "#5DCCCC";

/**
 * Accent Purple: Secondary accent for variety
 * Used for: Feature highlights, technical badges, decorative elements
 */
export const LANDING_PURPLE = "#A78BDD";

/**
 * Accent Blue: Cool complement to complete the palette
 * Used for: Technical/database content, neutral informational elements, self-hosted badges
 */
export const LANDING_BLUE = "#7BA8D1";

// ============================================================================
// Semantic Neutrals
// ============================================================================

/**
 * White variations for text and backgrounds
 */
export const LANDING_WHITE = "#FFFFFF";
export const LANDING_WHITE_90 = "rgba(255, 255, 255, 0.9)";
export const LANDING_WHITE_80 = "rgba(255, 255, 255, 0.8)";
export const LANDING_WHITE_70 = "rgba(255, 255, 255, 0.7)";
export const LANDING_WHITE_10 = "rgba(255, 255, 255, 0.1)";
export const LANDING_WHITE_5 = "rgba(255, 255, 255, 0.05)";

/**
 * Slate variations for cards, borders, and backgrounds
 */
export const LANDING_SLATE_900 = "#0f172a";
export const LANDING_SLATE_800 = "#1e293b";
export const LANDING_SLATE_700 = "#334155";
export const LANDING_SLATE_600 = "#475569";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert hex color to RGB values
 * @param hex - Hex color string (e.g., '#FFB088')
 * @returns Object with r, g, b values (0-255)
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Generate rgba color string with custom opacity
 * @param hex - Hex color string (e.g., '#FFB088')
 * @param alpha - Opacity value (0-1)
 * @returns rgba color string (e.g., 'rgba(255, 176, 136, 0.5)')
 */
export function withOpacity(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Pre-computed rgba variations for brand colors
 * Use these for common opacity requirements to avoid runtime calculations
 */
export const LANDING_PEACH_90 = withOpacity(LANDING_PEACH, 0.9);
export const LANDING_PEACH_80 = withOpacity(LANDING_PEACH, 0.8);
export const LANDING_PEACH_70 = withOpacity(LANDING_PEACH, 0.7);
export const LANDING_PEACH_50 = withOpacity(LANDING_PEACH, 0.5);
export const LANDING_PEACH_30 = withOpacity(LANDING_PEACH, 0.3);
export const LANDING_PEACH_20 = withOpacity(LANDING_PEACH, 0.2);
export const LANDING_PEACH_10 = withOpacity(LANDING_PEACH, 0.1);

export const LANDING_TEAL_90 = withOpacity(LANDING_TEAL, 0.9);
export const LANDING_TEAL_80 = withOpacity(LANDING_TEAL, 0.8);
export const LANDING_TEAL_70 = "rgba(93, 204, 204, 0.7)";
export const LANDING_TEAL_50 = "rgba(93, 204, 204, 0.5)";
export const LANDING_TEAL_30 = "rgba(93, 204, 204, 0.3)";
export const LANDING_TEAL_20 = "rgba(93, 204, 204, 0.2)";
export const LANDING_TEAL_10 = "rgba(93, 204, 204, 0.1)";

export const LANDING_PURPLE_90 = "rgba(167, 139, 221, 0.9)";
export const LANDING_PURPLE_80 = "rgba(167, 139, 221, 0.8)";
export const LANDING_PURPLE_70 = "rgba(167, 139, 221, 0.7)";
export const LANDING_PURPLE_50 = "rgba(167, 139, 221, 0.5)";
export const LANDING_PURPLE_30 = "rgba(167, 139, 221, 0.3)";
export const LANDING_PURPLE_20 = "rgba(167, 139, 221, 0.2)";
export const LANDING_PURPLE_10 = "rgba(167, 139, 221, 0.1)";

export const LANDING_BLUE_90 = "rgba(123, 168, 209, 0.9)";
export const LANDING_BLUE_80 = "rgba(123, 168, 209, 0.8)";
export const LANDING_BLUE_70 = "rgba(123, 168, 209, 0.7)";
export const LANDING_BLUE_50 = "rgba(123, 168, 209, 0.5)";
export const LANDING_BLUE_30 = "rgba(123, 168, 209, 0.3)";
export const LANDING_BLUE_20 = "rgba(123, 168, 209, 0.2)";
export const LANDING_BLUE_10 = "rgba(123, 168, 209, 0.1)";

// ============================================================================
// Usage Guidelines
// ============================================================================

/**
 * COLOR USAGE GUIDELINES:
 *
 * LANDING_PEACH (#FFB088):
 * - Primary CTAs and hero buttons
 * - Main brand highlights and focal points
 * - Warm, welcoming content
 * - Social/community features
 *
 * LANDING_TEAL (#5DCCCC):
 * - Interactive elements and links
 * - Professional/technical content
 * - Data and information displays
 * - Productivity features
 *
 * LANDING_PURPLE (#A78BDD):
 * - Feature highlights and badges
 * - Technical/architectural elements
 * - Secondary accents for variety
 * - Privacy/security features
 *
 * LANDING_BLUE (#7BA8D1):
 * - Database and technical infrastructure
 * - Self-hosted badges
 * - Technical metadata
 * - Cool neutral informational elements
 */
