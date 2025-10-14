/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { signUp } from "../src/lib/auth";
import * as inviteCodes from "../src/lib/inviteCodes";
import { supabase } from "../src/lib/supabase";

// Mock dependencies
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock("../src/lib/inviteCodes", () => ({
  validateInviteCode: vi.fn(),
  consumeInviteCode: vi.fn(),
}));

describe("auth with invite codes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("should reject signup without valid invite code", async () => {
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await signUp(
        "test@example.com",
        "password123",
        "INVALID-CODE"
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("Invalid or expired invite code");
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should reject signup when invite code validation errors", async () => {
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      });

      const result = await signUp(
        "test@example.com",
        "password123",
        "ABC-DEF-GHI-JKL"
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should create user account with valid invite code", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValue({
        data: true,
        error: null,
      });

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      } as any);

      vi.mocked(inviteCodes.consumeInviteCode).mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await signUp(
        "test@example.com",
        "password123",
        "ABC-DEF-GHI-JKL"
      );

      expect(inviteCodes.validateInviteCode).toHaveBeenCalledWith(
        "ABC-DEF-GHI-JKL"
      );
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(inviteCodes.consumeInviteCode).toHaveBeenCalledWith(
        "ABC-DEF-GHI-JKL",
        "user-123"
      );
      expect(result.data).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should still create account even if code consumption fails", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValue({
        data: true,
        error: null,
      });

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      } as any);

      vi.mocked(inviteCodes.consumeInviteCode).mockResolvedValue({
        data: false,
        error: new Error("Failed to consume"),
      });

      const result = await signUp(
        "test@example.com",
        "password123",
        "ABC-DEF-GHI-JKL"
      );

      // User should still be created even if consumption fails
      expect(result.data).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should handle Supabase auth errors", async () => {
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValue({
        data: true,
        error: null,
      });

      const authError = new Error("Email already exists");
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      } as any);

      const result = await signUp(
        "test@example.com",
        "password123",
        "ABC-DEF-GHI-JKL"
      );

      expect(result.data).toBeNull();
      expect(result.error).toEqual(authError);
    });

    it("should handle case when user creation returns no user", async () => {
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValue({
        data: true,
        error: null,
      });

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      const result = await signUp(
        "test@example.com",
        "password123",
        "ABC-DEF-GHI-JKL"
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("User creation failed");
    });

    it("should validate, create, then consume in correct order", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const callOrder: string[] = [];

      vi.mocked(inviteCodes.validateInviteCode).mockImplementation(async () => {
        callOrder.push("validate");
        return { data: true, error: null };
      });

      vi.mocked(supabase.auth.signUp).mockImplementation(async () => {
        callOrder.push("signup");
        return { data: { user: mockUser, session: null }, error: null } as any;
      });

      vi.mocked(inviteCodes.consumeInviteCode).mockImplementation(async () => {
        callOrder.push("consume");
        return { data: true, error: null };
      });

      await signUp("test@example.com", "password123", "ABC-DEF-GHI-JKL");

      expect(callOrder).toEqual(["validate", "signup", "consume"]);
    });
  });
});
