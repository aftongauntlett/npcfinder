/**
 * Tests for auth.ts
 * Covers signup, signin, signout flows with invite code validation
 * Uses mocked Supabase client for isolated unit tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "../src/lib/auth";
import * as inviteCodes from "../src/lib/inviteCodes";

// Mock the Supabase client
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

// Mock the inviteCodes module
vi.mock("../src/lib/inviteCodes");

import { supabase } from "../src/lib/supabase";

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("should successfully sign up with valid invite code", async () => {
      const email = "newuser@example.com";
      const password = "SecurePass123!";
      const inviteCode = "ABC-DEF-GHI-JKL";

      // Mock successful invite validation
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      // Mock successful user creation
      (supabase.auth.signUp as any).mockResolvedValueOnce({
        data: {
          user: { id: "user-123", email },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      // Mock successful invite consumption
      vi.mocked(inviteCodes.consumeInviteCode).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      const result = await auth.signUp(email, password, inviteCode);

      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe(email);
      expect(result.error).toBeNull();
      expect(inviteCodes.validateInviteCode).toHaveBeenCalledWith(
        inviteCode,
        email
      );
      expect(inviteCodes.consumeInviteCode).toHaveBeenCalledWith(
        inviteCode,
        "user-123"
      );
    });

    it("should fail when invite code is invalid", async () => {
      const email = "newuser@example.com";
      const password = "SecurePass123!";
      const inviteCode = "INVALID-CODE";

      // Mock failed invite validation
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValueOnce({
        data: false,
        error: null,
      });

      const result = await auth.signUp(email, password, inviteCode);

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain("Invalid invite code");
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should fail when email does not match invite code", async () => {
      const email = "wrong@example.com";
      const password = "SecurePass123!";
      const inviteCode = "ABC-DEF-GHI-JKL";

      // Mock validation failure due to email mismatch
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValueOnce({
        data: false,
        error: new Error("Email does not match invite code"),
      });

      const result = await auth.signUp(email, password, inviteCode);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it("should handle user creation errors", async () => {
      const email = "newuser@example.com";
      const password = "SecurePass123!";
      const inviteCode = "ABC-DEF-GHI-JKL";

      // Mock successful invite validation
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      // Mock failed user creation
      (supabase.auth.signUp as any).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Email already registered" },
      });

      const result = await auth.signUp(email, password, inviteCode);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(inviteCodes.consumeInviteCode).not.toHaveBeenCalled();
    });

    it("should create user but warn if invite consumption fails", async () => {
      const email = "newuser@example.com";
      const password = "SecurePass123!";
      const inviteCode = "ABC-DEF-GHI-JKL";

      // Mock successful invite validation
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      // Mock successful user creation
      (supabase.auth.signUp as any).mockResolvedValueOnce({
        data: {
          user: { id: "user-123", email },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      // Mock failed invite consumption (edge case)
      vi.mocked(inviteCodes.consumeInviteCode).mockResolvedValueOnce({
        data: false,
        error: new Error("Already consumed"),
      });

      const result = await auth.signUp(email, password, inviteCode);

      // User should be created despite consumption failure
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe("signIn", () => {
    it("should successfully sign in with valid credentials", async () => {
      const email = "user@example.com";
      const password = "Password123!";

      (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: {
          user: { id: "user-123", email },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      const result = await auth.signIn(email, password);

      expect(result.data).toBeDefined();
      expect(result.data?.access_token).toBe("token-123");
      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
    });

    it("should fail with invalid credentials", async () => {
      const email = "user@example.com";
      const password = "WrongPassword";

      (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      const result = await auth.signIn(email, password);

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain("Invalid login credentials");
    });

    it("should handle different email casing", async () => {
      const email = "User@Example.COM";
      const password = "Password123!";

      (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: {
          user: { id: "user-123", email: "user@example.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      await auth.signIn(email, password);

      // signIn passes email as-is to Supabase (no normalization in our code)
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
    });
  });

  describe("signOut", () => {
    it("should successfully sign out", async () => {
      (supabase.auth.signOut as any).mockResolvedValueOnce({
        error: null,
      });

      const result = await auth.signOut();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it("should handle signout errors", async () => {
      (supabase.auth.signOut as any).mockResolvedValueOnce({
        error: { message: "Network error" },
      });

      const result = await auth.signOut();

      expect(result.error?.message).toContain("Network error");
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user when authenticated", async () => {
      const mockUser = { id: "user-123", email: "user@example.com" };

      (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await auth.getCurrentUser();

      expect(result.data).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should return null when not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await auth.getCurrentUser();

      expect(result.data).toBeNull();
    });

    it("should handle authentication errors", async () => {
      (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Token expired" },
      });

      const result = await auth.getCurrentUser();

      expect(result.error?.message).toContain("Token expired");
    });
  });

  describe("getSession", () => {
    it("should return current session", async () => {
      const mockSession = {
        access_token: "token-123",
        refresh_token: "refresh-123",
      };

      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await auth.getSession();

      expect(result.data).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it("should return null when no session", async () => {
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await auth.getSession();

      expect(result.data).toBeNull();
    });
  });

  describe("Edge cases and security", () => {
    it("should pass email as-is to validateInviteCode", async () => {
      const email = "  user@example.com  ";
      const password = "Password123!";
      const inviteCode = "ABC-DEF-GHI-JKL";

      // signUp passes email as-is; validateInviteCode does the normalization
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      (supabase.auth.signUp as any).mockResolvedValueOnce({
        data: {
          user: { id: "user-123", email: "user@example.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      vi.mocked(inviteCodes.consumeInviteCode).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      await auth.signUp(email, password, inviteCode);

      // Email passed as-is to validateInviteCode (it does the trimming)
      expect(inviteCodes.validateInviteCode).toHaveBeenCalledWith(
        inviteCode,
        "  user@example.com  "
      );
    });

    it("should fail when invite code is empty", async () => {
      const email = "user@example.com";
      const password = "Password123!";

      // Mock validateInviteCode to handle empty string
      vi.mocked(inviteCodes.validateInviteCode).mockResolvedValueOnce({
        data: false,
        error: null,
      });

      const result = await auth.signUp(email, password, "");

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain("Invalid invite code");
    });
  });
});
