import { describe, it, expect, vi, beforeEach } from "vitest";
import { signUp } from "../src/lib/auth";

// Define mock functions before vi.mock calls
const mockSignUp = vi.fn();
const mockValidateInviteCode = vi.fn();
const mockConsumeInviteCode = vi.fn();

// Mock dependencies
vi.mock("../src/lib/supabase", () => {
  return {
    supabase: {
      auth: {
        signUp: (...args: unknown[]) => mockSignUp(...args),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn(),
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(),
      },
    },
  };
});

vi.mock("../src/lib/inviteCodes", () => {
  return {
    validateInviteCode: (...args: unknown[]) => mockValidateInviteCode(...args),
    consumeInviteCode: (...args: unknown[]) => mockConsumeInviteCode(...args),
  };
});

describe("auth with invite codes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("should reject signup without valid invite code", async () => {
      mockValidateInviteCode.mockResolvedValue({
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
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should reject signup when invite code validation errors", async () => {
      mockValidateInviteCode.mockResolvedValue({
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
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should create user account with valid invite code", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockValidateInviteCode.mockResolvedValue({
        data: true,
        error: null,
      });

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      mockConsumeInviteCode.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await signUp(
        "test@example.com",
        "password123",
        "ABC-DEF-GHI-JKL"
      );

      expect(mockValidateInviteCode).toHaveBeenCalledWith("ABC-DEF-GHI-JKL");
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockConsumeInviteCode).toHaveBeenCalledWith(
        "ABC-DEF-GHI-JKL",
        "user-123"
      );
      expect(result.data).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should still create account even if code consumption fails", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockValidateInviteCode.mockResolvedValue({
        data: true,
        error: null,
      });

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      mockConsumeInviteCode.mockResolvedValue({
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
      mockValidateInviteCode.mockResolvedValue({
        data: true,
        error: null,
      });

      const authError = new Error("Email already exists");

      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      const result = await signUp(
        "test@example.com",
        "password123",
        "ABC-DEF-GHI-JKL"
      );

      expect(result.data).toBeNull();
      expect(result.error).toEqual(authError);
    });

    it("should handle case when user creation returns no user", async () => {
      mockValidateInviteCode.mockResolvedValue({
        data: true,
        error: null,
      });

      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

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

      mockValidateInviteCode.mockImplementation(() => {
        callOrder.push("validate");
        return Promise.resolve({ data: true, error: null });
      });

      mockSignUp.mockImplementation(() => {
        callOrder.push("signup");
        return Promise.resolve({
          data: { user: mockUser, session: null },
          error: null,
        });
      });

      mockConsumeInviteCode.mockImplementation(() => {
        callOrder.push("consume");
        return Promise.resolve({ data: true, error: null });
      });

      await signUp("test@example.com", "password123", "ABC-DEF-GHI-JKL");

      expect(callOrder).toEqual(["validate", "signup", "consume"]);
    });
  });
});
