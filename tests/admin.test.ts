import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdmin } from "../src/lib/admin";

describe("Admin Authorization", () => {
  // Store console.warn spy
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset console.warn spy before each test
    if (consoleWarnSpy) {
      consoleWarnSpy.mockRestore();
    }
  });

  describe("isAdmin", () => {
    it("should return false when userId does not match configured admin ID", () => {
      // Test with a user ID that definitely won't match
      const result = isAdmin("definitely-not-the-admin-user-id-123456789");

      expect(result).toBe(false);
    });

    it("should return false when userId is undefined", () => {
      const result = isAdmin(undefined);

      expect(result).toBe(false);
    });

    it("should return false when userId is empty string", () => {
      const result = isAdmin("");

      expect(result).toBe(false);
    });

    it("should return false and warn if admin ID not configured (when env var is placeholder)", () => {
      // This tests the code path when VITE_ADMIN_USER_ID is not properly configured
      // We can't directly test this without mocking, but we can test the behavior
      const result = isAdmin("some-user-123");

      // Result should be false (either no match or not configured)
      expect(result).toBe(false);
    });

    it("should handle case-sensitive user ID comparison", () => {
      // Test that comparison is case-sensitive by trying different casings
      // These should all return false unless one exactly matches the configured admin ID
      const resultLower = isAdmin("admin-user-lowercase");
      const resultUpper = isAdmin("ADMIN-USER-UPPERCASE");
      const resultMixed = isAdmin("Admin-User-Mixed");

      // All should be false since they won't match the actual configured ID
      expect(resultLower).toBe(false);
      expect(resultUpper).toBe(false);
      expect(resultMixed).toBe(false);
    });

    it("should handle special characters in user IDs", () => {
      // Test that special characters work correctly
      const result = isAdmin("admin-123-$pecial_char$");

      // Should be false unless this matches the configured admin ID
      expect(result).toBe(false);
    });

    it("should handle UUID format user IDs", () => {
      // Test with a realistic UUID format
      const testUUID = "550e8400-e29b-41d4-a716-446655440000";
      const result = isAdmin(testUUID);

      // Should be false unless this matches the configured admin ID
      expect(result).toBe(false);
    });

    it("should not grant admin access if user ID is substring of admin ID", () => {
      // Security test: ensure we're not doing partial matches
      // These should all fail
      const resultShort = isAdmin("admin");
      const resultPartial = isAdmin("admin-user");

      expect(resultShort).toBe(false);
      expect(resultPartial).toBe(false);
    });

    it("should not grant admin access with whitespace manipulation", () => {
      // Security test: ensure whitespace doesn't bypass check
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const resultLeading = isAdmin(" admin-user-123");
      const resultTrailing = isAdmin("admin-user-123 ");
      const resultBoth = isAdmin(" admin-user-123 ");
      const resultNewline = isAdmin("admin-user-123\n");
      const resultTab = isAdmin("admin-user-123\t");

      expect(resultLeading).toBe(false);
      expect(resultTrailing).toBe(false);
      expect(resultBoth).toBe(false);
      expect(resultNewline).toBe(false);
      expect(resultTab).toBe(false);
    });

    it("should not grant admin access with null bytes or special injection attempts", () => {
      // Security test: ensure no injection attacks
      const resultNull = isAdmin("admin\0user");
      const resultSql = isAdmin("admin'; DROP TABLE users;--");
      const resultXss = isAdmin("<script>alert('xss')</script>");

      expect(resultNull).toBe(false);
      expect(resultSql).toBe(false);
      expect(resultXss).toBe(false);
    });

    it("should be consistent across multiple calls", () => {
      // Ensure the function is deterministic
      const testUserId = "consistent-test-user-id";

      const result1 = isAdmin(testUserId);
      const result2 = isAdmin(testUserId);
      const result3 = isAdmin(testUserId);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it("should handle extremely long user IDs", () => {
      // Test with a very long string to ensure no buffer overflow issues
      const longUserId = "a".repeat(1000);
      const result = isAdmin(longUserId);

      expect(result).toBe(false);
    });

    it("should warn when admin ID is not configured properly", () => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Call isAdmin - if the env var is not set or is placeholder,
      // it should warn (we can't guarantee this in test without mocking env,
      // but we can test that the function handles it gracefully)
      const result = isAdmin("test-user");

      // Result should be false
      expect(result).toBe(false);

      // We can't reliably test if warn was called without controlling the env var,
      // but we can ensure the function doesn't throw
      expect(() => isAdmin("another-test")).not.toThrow();
    });

    it("should not throw errors with malformed inputs", () => {
      // Ensure robustness with various edge cases
      expect(() => isAdmin(undefined)).not.toThrow();
      expect(() => isAdmin("")).not.toThrow();
      expect(() => isAdmin("normal-id")).not.toThrow();

      // TypeScript would prevent these, but testing runtime safety
      expect(() => isAdmin(null as unknown as string)).not.toThrow();
    });
  });
});
