import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSecureCode,
  validateInviteCode,
  consumeInviteCode,
  createInviteCode,
} from "../src/lib/inviteCodes";

// Mock Supabase - use factory function to avoid hoisting issues
const mockRpc = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("../src/lib/supabase", () => {
  return {
    supabase: {
      rpc: (...args: unknown[]) => mockRpc(...args),
      from: (...args: unknown[]) => mockFrom(...args),
      auth: {
        getUser: (...args: unknown[]) => mockGetUser(...args),
      },
    },
  };
});

describe("inviteCodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateSecureCode", () => {
    it("should generate a code in XXX-XXX-XXX-XXX format", () => {
      const code = generateSecureCode();
      expect(code).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/);
    });

    it("should generate unique codes", () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateSecureCode());
      }
      expect(codes.size).toBe(100);
    });

    it("should not contain ambiguous characters", () => {
      const ambiguousChars = /[01OILSZ]/i;
      for (let i = 0; i < 50; i++) {
        const code = generateSecureCode();
        expect(code).not.toMatch(ambiguousChars);
      }
    });
  });

  describe("validateInviteCode", () => {
    it("should return true for valid code", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });
      const result = await validateInviteCode("ABC-DEF-GHI-JKL");
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should trim and uppercase the code", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });
      await validateInviteCode("  abc-def-ghi-jkl  ");
      expect(mockRpc).toHaveBeenCalledWith("validate_invite_code", {
        code_to_check: "ABC-DEF-GHI-JKL",
      });
    });
  });

  describe("consumeInviteCode", () => {
    it("should consume a valid code", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });
      const result = await consumeInviteCode("ABC-DEF-GHI-JKL", "user-123");
      expect(result.data).toBe(true);
    });
  });

  describe("createInviteCode", () => {
    it("should require authentication", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const result = await createInviteCode();
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
