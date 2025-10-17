/**
 * Simple utility test - testing a pure function
 * This is the easiest type of test: no mocks, no React, just logic
 */

import { describe, it, expect } from "vitest";

// Simple utility function to test
// Note: Parses date string with explicit UTC to avoid timezone issues
function formatDate(dateString: string): string {
  // Split the date and create Date object with explicit UTC timezone
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

describe("formatDate", () => {
  it("formats ISO date string correctly", () => {
    const result = formatDate("2024-01-15");
    expect(result).toBe("Jan 15, 2024");
  });

  it("handles different month", () => {
    const result = formatDate("2024-12-25");
    expect(result).toBe("Dec 25, 2024");
  });

  it("handles current year", () => {
    const result = formatDate("2025-10-17");
    expect(result).toBe("Oct 17, 2025");
  });
});
