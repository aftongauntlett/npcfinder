import { describe, it, expect } from "vitest";
import { isSetupError, getErrorMessage } from "../src/utils/errorUtils";

describe("errorUtils", () => {
  describe("isSetupError", () => {
    it("returns false for null or undefined", () => {
      expect(isSetupError(null)).toBe(false);
      expect(isSetupError(undefined)).toBe(false);
    });

    it("returns true for errors with setup-related keywords", () => {
      expect(isSetupError({ message: "relation does not exist" })).toBe(true);
      expect(isSetupError({ message: "table not found" })).toBe(true);
      expect(isSetupError({ message: "could not find table" })).toBe(true);
    });

    it("returns true for errors with setup error codes", () => {
      expect(isSetupError({ code: "42P01" })).toBe(true);
      expect(isSetupError({ code: "PGRST116" })).toBe(true);
      expect(isSetupError({ code: "PGRST204" })).toBe(true);
    });

    it("returns false for non-setup errors", () => {
      expect(isSetupError({ message: "Network error" })).toBe(false);
      expect(isSetupError({ message: "Unauthorized" })).toBe(false);
      expect(isSetupError({ code: "OTHER_ERROR" })).toBe(false);
    });

    it("is case insensitive for message matching", () => {
      expect(isSetupError({ message: "RELATION DOES NOT EXIST" })).toBe(true);
      expect(isSetupError({ message: "Table Not Found" })).toBe(true);
    });
  });

  describe("getErrorMessage", () => {
    it("returns setup message for setup errors", () => {
      const error = { message: "relation does not exist" };
      expect(getErrorMessage(error)).toBe("Database setup required");
    });

    it("returns the error message for non-setup errors", () => {
      const error = { message: "Network error occurred" };
      expect(getErrorMessage(error)).toBe("Network error occurred");
    });

    it("returns default message when error has no message", () => {
      expect(getErrorMessage({})).toBe("An error occurred");
    });

    it("returns custom default message", () => {
      expect(getErrorMessage({}, "Custom error")).toBe("Custom error");
    });

    it("handles null and undefined", () => {
      expect(getErrorMessage(null)).toBe("An error occurred");
      expect(getErrorMessage(undefined)).toBe("An error occurred");
    });
  });
});
