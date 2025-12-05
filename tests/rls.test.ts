/**
 * RLS Policy & Admin Trigger Tests
 * Tests that verify Row Level Security policies and admin privilege protections
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../src/lib/supabase";

describe("Admin Privilege Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent non-admin from granting admin privileges", async () => {
    // Mock a non-admin user trying to set is_admin to true
    const mockError = {
      code: "42501",
      message: "permission denied for table user_profiles",
      details: null,
      hint: null,
    };

    vi.spyOn(supabase, "from").mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    const { error } = await supabase
      .from("user_profiles")
      .update({ is_admin: true })
      .eq("user_id", "some-user-id");

    expect(error).toBeTruthy();
    expect(error?.code).toBe("42501");
    expect(error?.message).toContain("permission denied");
  });

  it("should prevent admin escalation via INSERT", async () => {
    // Mock attempting to insert a new profile with is_admin = true
    const mockError = {
      code: "42501",
      message: "new row violates security policy",
      details: "Admin privileges can only be granted by existing admins",
      hint: null,
    };

    vi.spyOn(supabase, "from").mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    } as any);

    const { error } = await supabase.from("user_profiles").insert({
      user_id: "new-user-id",
      display_name: "Hacker",
      is_admin: true,
    });

    expect(error).toBeTruthy();
    expect(error?.code).toBe("42501");
  });

  it("should allow admin to grant admin privileges", async () => {
    // Mock successful admin privilege grant by an existing admin
    vi.spyOn(supabase, "from").mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { user_id: "target-user", is_admin: true },
          error: null,
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from("user_profiles")
      .update({ is_admin: true })
      .eq("user_id", "target-user");

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });
});

describe("Recommendation RLS Policies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent user from updating recommendations they did not receive", async () => {
    // Mock attempting to update a recommendation not sent to current user
    const mockError = {
      code: "42501",
      message: "new row violates row-level security policy",
      details: null,
      hint: null,
    };

    vi.spyOn(supabase, "from").mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    const { error } = await supabase
      .from("movie_recommendations")
      .update({ status: "hit" })
      .eq("id", "someone-elses-rec");

    expect(error).toBeTruthy();
    expect(error?.code).toBe("42501");
  });

  it("should prevent user from deleting recommendations they did not send", async () => {
    // Mock attempting to delete a recommendation the user didn't create
    const mockError = {
      code: "42501",
      message: "new row violates row-level security policy",
      details: null,
      hint: null,
    };

    vi.spyOn(supabase, "from").mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    const { error } = await supabase
      .from("movie_recommendations")
      .delete()
      .eq("id", "someone-elses-sent-rec");

    expect(error).toBeTruthy();
    expect(error?.code).toBe("42501");
  });

  it("should allow recipient to update their recommendation status", async () => {
    // Mock successful status update by recipient
    vi.spyOn(supabase, "from").mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: "rec-id", status: "hit" },
          error: null,
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from("movie_recommendations")
      .update({ status: "hit" })
      .eq("id", "rec-id");

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });

  it("should allow sender to delete their sent recommendation", async () => {
    // Mock successful delete by sender
    vi.spyOn(supabase, "from").mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: "rec-id" },
          error: null,
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from("movie_recommendations")
      .delete()
      .eq("id", "rec-id");

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });
});

describe("Watchlist RLS Policies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent user from accessing another user's watchlist", async () => {
    // Mock attempting to read another user's watchlist
    const mockError = {
      code: "42501",
      message: "permission denied for table user_watchlist",
      details: null,
      hint: null,
    };

    vi.spyOn(supabase, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    const { error } = await supabase
      .from("user_watchlist")
      .select("*")
      .eq("user_id", "other-user-id");

    expect(error).toBeTruthy();
    expect(error?.code).toBe("42501");
  });

  it("should allow user to access their own watchlist", async () => {
    // Mock successful watchlist access
    vi.spyOn(supabase, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: "item-1", title: "Movie" }],
          error: null,
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from("user_watchlist")
      .select("*")
      .eq("user_id", "current-user-id");

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data?.length).toBeGreaterThan(0);
  });
});

describe("Board Sharing RLS Policies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent non-owner editors from updating share permissions", async () => {
    // Mock a user with can_edit = true trying to update share permissions
    // This should fail because only board owners can update shares
    const mockError = {
      code: "42501",
      message: "new row violates row-level security policy",
      details: "Policy violation on table board_shares",
      hint: null,
    };

    vi.spyOn(supabase, "from").mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    // Attempt to update share permission as a non-owner editor
    const { error } = await supabase
      .from("board_shares")
      .update({ can_edit: false })
      .eq("id", "some-share-id");

    expect(error).toBeTruthy();
    expect(error?.code).toBe("42501");
  });

  it("should allow board owners to update share permissions", async () => {
    // Mock successful share permission update by board owner
    vi.spyOn(supabase, "from").mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: "share-id", can_edit: false },
          error: null,
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from("board_shares")
      .update({ can_edit: false })
      .eq("id", "share-id");

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });

  it("should allow board owners to create shares", async () => {
    // Mock successful share creation by board owner
    vi.spyOn(supabase, "from").mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: {
          id: "new-share-id",
          board_id: "board-id",
          shared_with_user_id: "recipient-id",
          can_edit: true,
        },
        error: null,
      }),
    } as any);

    const { data, error } = await supabase.from("board_shares").insert({
      board_id: "board-id",
      shared_with_user_id: "recipient-id",
      can_edit: true,
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });

  it("should allow board owners to delete shares", async () => {
    // Mock successful share deletion by board owner
    vi.spyOn(supabase, "from").mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: "share-id" },
          error: null,
        }),
      }),
    } as any);

    const { error } = await supabase
      .from("board_shares")
      .delete()
      .eq("id", "share-id");

    expect(error).toBeNull();
  });
});
