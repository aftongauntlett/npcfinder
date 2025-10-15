import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Music from "../src/components/Music";

// Mock AuthContext
vi.mock("../src/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    loading: false,
  }),
}));

// Create mock function
const mockFrom = vi.fn();

// Mock Supabase - use factory to avoid hoisting issues
vi.mock("../src/lib/supabase", () => {
  return {
    supabase: {
      from: (...args: unknown[]) => mockFrom(...args),
    },
  };
});

// Mock SendMediaModal
vi.mock("../src/components/shared/SendMediaModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="send-music-modal">Send Music Modal</div> : null,
}));

describe("Music Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock - returns empty data
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
  });

  it("renders the Music page", () => {
    render(<Music />);
    expect(screen.getByText("Music")).toBeInTheDocument();
  });

  it("shows Send Music button", () => {
    render(<Music />);
    expect(
      screen.getByRole("button", { name: /send music/i })
    ).toBeInTheDocument();
  });

  it("opens modal when Send Music button is clicked", async () => {
    const user = userEvent.setup();
    render(<Music />);

    await user.click(screen.getByRole("button", { name: /send music/i }));

    await waitFor(() => {
      expect(screen.getByTestId("send-music-modal")).toBeInTheDocument();
    });
  });

  it("shows empty state when no recommendations", async () => {
    render(<Music />);
    await waitFor(() => {
      expect(screen.getByText(/no recommendations yet/i)).toBeInTheDocument();
    });
  });

  it("displays friend cards when recommendations exist", async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ from_user_id: "friend-1", status: "pending" }],
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ user_id: "friend-1", display_name: "Sarah" }],
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ count: 0, error: null }),
      });

    render(<Music />);

    await waitFor(() => {
      expect(screen.getByText("Sarah")).toBeInTheDocument();
    });
  });
});
