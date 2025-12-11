/**
 * Utility functions for detecting location type from text
 */

export type LocationType = "Remote" | "Hybrid" | "In-Office";

/**
 * Detects location type from text (case-insensitive)
 * Looks for keywords "remote" or "hybrid" in the text
 * If neither is found, defaults to "In-Office"
 * 
 * @param text - Text to analyze (can be URL, location string, etc.)
 * @returns LocationType - "Remote", "Hybrid", or "In-Office"
 */
export function detectLocationType(text: string | undefined): LocationType {
  if (!text) {
    return "In-Office";
  }

  const lowerText = text.toLowerCase();

  // Check for "remote" keyword
  if (lowerText.includes("remote")) {
    return "Remote";
  }

  // Check for "hybrid" keyword
  if (lowerText.includes("hybrid")) {
    return "Hybrid";
  }

  // Default to In-Office if no keywords found
  return "In-Office";
}

/**
 * Detects location type from a job posting URL
 * 
 * @param url - Job posting URL
 * @returns LocationType - "Remote", "Hybrid", or "In-Office"
 */
export function detectLocationTypeFromUrl(url: string | undefined): LocationType {
  return detectLocationType(url);
}

/**
 * Detects location type from location text field
 * Useful for manual entry scenarios
 * 
 * @param location - Location text (e.g., "San Francisco, CA", "Remote", "Hybrid - Boston")
 * @returns LocationType - "Remote", "Hybrid", or "In-Office"
 */
export function detectLocationTypeFromLocationText(location: string | undefined): LocationType {
  return detectLocationType(location);
}
