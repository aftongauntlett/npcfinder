/**
 * Date formatting utilities
 */

/**
 * Formats a release date from "YYYY-MM-DD" to "Month DDth, YYYY"
 * Example: "2025-04-30" → "April 30th, 2025"
 */
export function formatReleaseDate(
  dateString: string | null | undefined
): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues

    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();

    // Get ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
  } catch {
    // If parsing fails, return the original string
    return dateString;
  }
}

/**
 * Formats a release date to just the year
 * Example: "2025-04-30" → "2025"
 */
export function formatReleaseYear(
  dateString: string | null | undefined
): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString + "T00:00:00");
    return date.getFullYear().toString();
  } catch {
    return dateString.split("-")[0] || dateString;
  }
}
