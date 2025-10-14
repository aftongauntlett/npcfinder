/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSecureCode,
  validateInviteCode,
  consumeInviteCode,
  createInviteCode,
  getAllInviteCodes,
  revokeInviteCode,
  getInviteCodeStats,
  batchCreateInviteCodes,
} from "../src/lib/inviteCodes";
import { supabase } from "../src/lib/supabase";

// Mock Supabase
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        order: vi.fn(),
        eq: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

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

    it("should always be 15 characters long (including dashes)", () => {
      for (let i = 0; i < 20; i++) {
        const code = generateSecureCode();
        expect(code.length).toBe(15);
      }
    });
  });

  describe("validateInviteCode", () => {
    it("should call the validate_invite_code RPC function", async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      (supabase.rpc as any) = mockRpc;

      await validateInviteCode("ABC-DEF-GHI-JKL");

      expect(mockRpc).toHaveBeenCalledWith("validate_invite_code", {
        code_to_check: "ABC-DEF-GHI-JKL",
      });
    });

    it("should return true for valid code", async () => {
      (supabase.rpc as any) = vi
        .fn()
        .mockResolvedValue({ data: true, error: null });

      const result = await validateInviteCode("ABC-DEF-GHI-JKL");

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should return false for invalid code", async () => {
      (supabase.rpc as any) = vi
        .fn()
        .mockResolvedValue({ data: false, error: null });

      const result = await validateInviteCode("INVALID-CODE");

      expect(result.data).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      const mockError = new Error("Database error");
      (supabase.rpc as any) = vi
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      const result = await validateInviteCode("ABC-DEF-GHI-JKL");

      expect(result.data).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should trim and uppercase the code", async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      (supabase.rpc as any) = mockRpc;

      await validateInviteCode("  abc-def-ghi-jkl  ");

      expect(mockRpc).toHaveBeenCalledWith("validate_invite_code", {
        code_to_check: "ABC-DEF-GHI-JKL",
      });
    });
  });

  describe("consumeInviteCode", () => {
    it("should call the consume_invite_code RPC function", async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      (supabase.rpc as any) = mockRpc;

      await consumeInviteCode("ABC-DEF-GHI-JKL", "user-123");

      expect(mockRpc).toHaveBeenCalledWith("consume_invite_code", {
        code_to_use: "ABC-DEF-GHI-JKL",
        user_id: "user-123",
      });
    });

    it("should return true on successful consumption", async () => {
      (supabase.rpc as any) = vi
        .fn()
        .mockResolvedValue({ data: true, error: null });

      const result = await consumeInviteCode("ABC-DEF-GHI-JKL", "user-123");

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should handle consumption errors", async () => {
      const mockError = new Error("Code already used");
      (supabase.rpc as any) = vi
        .fn()
        .mockResolvedValue({ data: false, error: mockError });

      const result = await consumeInviteCode("ABC-DEF-GHI-JKL", "user-123");

      expect(result.data).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("createInviteCode", () => {
    it("should create a code with default parameters", async () => {
      const mockUser = { id: "admin-123" };
      (supabase.auth.getUser as any) = vi
        .fn()
        .mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { code: "ABC-DEF-GHI-JKL" },
            error: null,
          }),
        }),
      });
      (supabase.from as any) = vi.fn().mockReturnValue({ insert: mockInsert });

      const result = await createInviteCode();

      expect(result.data).toBeTruthy();
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should create a code with custom parameters", async () => {
      const mockUser = { id: "admin-123" };
      (supabase.auth.getUser as any) = vi
        .fn()
        .mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { code: "ABC-DEF-GHI-JKL" },
            error: null,
          }),
        }),
      });
      (supabase.from as any) = vi.fn().mockReturnValue({ insert: mockInsert });

      await createInviteCode("For John Doe", 5, 7);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.notes).toBe("For John Doe");
      expect(insertCall.max_uses).toBe(5);
      expect(insertCall.expires_at).toBeTruthy();
    });

    it("should require authentication", async () => {
      (supabase.auth.getUser as any) = vi
        .fn()
        .mockResolvedValue({ data: { user: null } });

      const result = await createInviteCode();

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe("getAllInviteCodes", () => {
    it("should fetch all invite codes", async () => {
      const mockCodes = [
        { code: "ABC-DEF-GHI-JKL", is_active: true },
        { code: "MNO-PQR-STU-VWX", is_active: false },
      ];

      const mockOrder = vi
        .fn()
        .mockResolvedValue({ data: mockCodes, error: null });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as any) = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await getAllInviteCodes();

      expect(result.data).toEqual(mockCodes);
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOrder).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("should handle fetch errors", async () => {
      const mockError = new Error("Database error");
      const mockOrder = vi
        .fn()
        .mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as any) = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await getAllInviteCodes();

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe("revokeInviteCode", () => {
    it("should revoke a code by setting is_active to false", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any) = vi.fn().mockReturnValue({ update: mockUpdate });

      const result = await revokeInviteCode("code-id-123");

      expect(result.data).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
      expect(mockEq).toHaveBeenCalledWith("id", "code-id-123");
    });

    it("should handle revocation errors", async () => {
      const mockError = new Error("Permission denied");
      const mockEq = vi.fn().mockResolvedValue({ error: mockError });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any) = vi.fn().mockReturnValue({ update: mockUpdate });

      const result = await revokeInviteCode("code-id-123");

      expect(result.data).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("getInviteCodeStats", () => {
    it("should calculate correct statistics", async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000); // +1 day
      const past = new Date(now.getTime() - 86400000); // -1 day

      const mockCodes = [
        {
          is_active: true,
          current_uses: 0,
          max_uses: 1,
          expires_at: future.toISOString(),
        }, // active
        {
          is_active: true,
          current_uses: 1,
          max_uses: 1,
          expires_at: future.toISOString(),
        }, // used
        {
          is_active: true,
          current_uses: 0,
          max_uses: 1,
          expires_at: past.toISOString(),
        }, // expired
        { is_active: false, current_uses: 0, max_uses: 1, expires_at: null }, // revoked
      ];

      const mockSelect = vi
        .fn()
        .mockResolvedValue({ data: mockCodes, error: null });
      (supabase.from as any) = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await getInviteCodeStats();

      expect(result.data).toEqual({
        total: 4,
        active: 1,
        used: 1,
        expired: 1,
      });
    });

    it("should handle empty code list", async () => {
      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
      (supabase.from as any) = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await getInviteCodeStats();

      expect(result.data).toEqual({
        total: 0,
        active: 0,
        used: 0,
        expired: 0,
      });
    });
  });

  describe("batchCreateInviteCodes", () => {
    it("should create multiple codes at once", async () => {
      const mockUser = { id: "admin-123" };
      (supabase.auth.getUser as any) = vi
        .fn()
        .mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          { code: "ABC-DEF-GHI-JKL" },
          { code: "MNO-PQR-STU-VWX" },
          { code: "YZA-BCD-EFG-HIJ" },
        ],
        error: null,
      });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as any) = vi.fn().mockReturnValue({ insert: mockInsert });

      const result = await batchCreateInviteCodes(3, "Batch test");

      expect(result.data).toHaveLength(3);
      expect(mockInsert).toHaveBeenCalled();
      const insertedCodes = mockInsert.mock.calls[0][0];
      expect(insertedCodes).toHaveLength(3);
      expect(insertedCodes[0].notes).toBe("Batch test");
    });

    it("should generate unique codes in batch", async () => {
      const mockUser = { id: "admin-123" };
      (supabase.auth.getUser as any) = vi
        .fn()
        .mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as any) = vi.fn().mockReturnValue({ insert: mockInsert });

      await batchCreateInviteCodes(10);

      const insertedCodes = mockInsert.mock.calls[0][0];
      const codes = insertedCodes.map((c: any) => c.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(10);
    });

    it("should require authentication for batch creation", async () => {
      (supabase.auth.getUser as any) = vi
        .fn()
        .mockResolvedValue({ data: { user: null } });

      const result = await batchCreateInviteCodes(5);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
