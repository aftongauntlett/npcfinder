/**
 * Tests for inviteCodes.ts
 * Covers invite code validation, consumption, creation, and management
 * Uses mocked Supabase client for isolated unit tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as inviteCodes from "../src/lib/inviteCodes";

// Mock the Supabase client
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from "../src/lib/supabase";

// Helper to create proper response structure
const mockResponse = (data: any, error: any = null) => ({
  data,
  error,
  count: null,
  status: error ? 500 : 200,
  statusText: error ? "Error" : "OK",
});

describe("inviteCodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateInviteCode", () => {
    it("should return true for valid invite code with matching email", async () => {
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(true));

      const result = await inviteCodes.validateInviteCode(
        "ABC-DEF-GHI-JKL",
        "test@example.com"
      );

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith("validate_invite_code", {
        code_value: "ABC-DEF-GHI-JKL",
        user_email: "test@example.com",
      });
    });

    it("should return false for invalid invite code", async () => {
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(false));

      const result = await inviteCodes.validateInviteCode(
        "INVALID-CODE",
        "test@example.com"
      );

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(null, dbError));

      const result = await inviteCodes.validateInviteCode(
        "ABC-DEF-GHI-JKL",
        "test@example.com"
      );

      expect(result.data).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it("should normalize code and email", async () => {
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(true));

      await inviteCodes.validateInviteCode("abc-def", "Test@Example.COM");

      expect(supabase.rpc).toHaveBeenCalledWith("validate_invite_code", {
        code_value: "ABC-DEF",
        user_email: "test@example.com",
      });
    });
  });

  describe("consumeInviteCode", () => {
    it("should successfully consume a valid invite code", async () => {
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(true));

      const result = await inviteCodes.consumeInviteCode(
        "ABC-DEF-GHI-JKL",
        "user-123"
      );

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith("consume_invite_code", {
        code_value: "ABC-DEF-GHI-JKL",
        user_id: "user-123",
      });
    });

    it("should return false when code is already consumed", async () => {
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(false));

      const result = await inviteCodes.consumeInviteCode(
        "ABC-DEF-GHI-JKL",
        "user-123"
      );

      expect(result.data).toBe(false);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Failed to update");
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(null, dbError));

      const result = await inviteCodes.consumeInviteCode(
        "ABC-DEF-GHI-JKL",
        "user-123"
      );

      expect(result.data).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("createInviteCode", () => {
    beforeEach(() => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: "admin-123" } },
        error: null,
      });
    });

    it("should create invite code with email", async () => {
      const mockCode = {
        id: "code-id-123",
        code: "NEW-CODE-HERE",
        intended_email: "friend@example.com",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCode,
              error: null,
            }),
          }),
        }),
      });

      const result = await inviteCodes.createInviteCode("friend@example.com");

      expect(result.data).toEqual(mockCode);
      expect(result.error).toBeNull();
    });

    it("should normalize email to lowercase", async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await inviteCodes.createInviteCode("Friend@Example.COM");

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          intended_email: "friend@example.com",
        })
      );
    });

    it("should fail when not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await inviteCodes.createInviteCode("friend@example.com");

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("getAllInviteCodes", () => {
    it("should fetch all invite codes", async () => {
      const mockCodes = [
        { id: "1", code: "CODE-ONE", created_by: "admin-1", used_by: null },
        { id: "2", code: "CODE-TWO", created_by: "admin-1", used_by: "user-1" },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCodes,
              error: null,
            }),
          }),
        }),
      });

      // Mock profiles fetch for user display names
      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockCodes,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { id: "admin-1", display_name: "Admin" },
                { id: "user-1", display_name: "User" },
              ],
              error: null,
            }),
          }),
        });

      const result = await inviteCodes.getAllInviteCodes();

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
    });
  });

  describe("revokeInviteCode", () => {
    it("should successfully revoke an invite code", async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await inviteCodes.revokeInviteCode("code-id-123");

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should handle deletion errors", async () => {
      const dbError = new Error("Code not found");

      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: dbError,
          }),
        }),
      });

      const result = await inviteCodes.revokeInviteCode("invalid-id");

      expect(result.data).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("generateSecureCode", () => {
    it("should generate code with correct format", () => {
      const code = inviteCodes.generateSecureCode();
      expect(code).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/);
    });

    it("should not include ambiguous characters", () => {
      const ambiguous = ["0", "O", "1", "I", "L", "S", "Z"];

      for (let i = 0; i < 100; i++) {
        const code = inviteCodes.generateSecureCode();
        ambiguous.forEach((char) => {
          expect(code).not.toContain(char);
        });
      }
    });

    it("should generate unique codes", () => {
      const codes = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        codes.add(inviteCodes.generateSecureCode());
      }

      expect(codes.size).toBe(1000);
    });
  });

  describe("Edge cases", () => {
    it("should handle whitespace in inputs", async () => {
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(true));

      await inviteCodes.validateInviteCode(
        "  ABC-DEF  ",
        "  test@example.com  "
      );

      expect(supabase.rpc).toHaveBeenCalledWith("validate_invite_code", {
        code_value: "ABC-DEF",
        user_email: "test@example.com",
      });
    });

    it("should handle empty strings", async () => {
      (supabase.rpc as any).mockResolvedValueOnce(mockResponse(false));

      const result = await inviteCodes.validateInviteCode("", "");

      expect(result.data).toBe(false);
    });
  });
});
