import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Music from "../src/components/Music";

// Mock the entire AuthContext module
vi.mock("../src/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    loading: false,
  }),
}));
import { supabase } from "../src/lib/supabase";

// Mock Supabase
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock SendMusicModal
vi.mock("../src/components/media/SendMusicModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="send-music-modal">Send Music Modal</div> : null,
}));

describe("Music Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Music page with header", () => {
    render(<Music />);
    expect(screen.getByText("Music")).toBeInTheDocument();
  });

  it("shows Send Music button", () => {
    render(<Music />);
    expect(
      screen.getByRole("button", { name: /send music/i })
    ).toBeInTheDocument();
  });

  it("opens SendMusicModal when Send Music button is clicked", async () => {
    const user = userEvent.setup();
    render(<Music />);

    const sendButton = screen.getByRole("button", { name: /send music/i });
    await user.click(sendButton);

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

  it("displays From Friends section", async () => {
    render(<Music />);

    await waitFor(() => {
      expect(screen.getByText("From Friends")).toBeInTheDocument();
    });
  });

  it("shows quick stats tiles", async () => {
    render(<Music />);

    await waitFor(() => {
      expect(screen.getByText("Your Hits")).toBeInTheDocument();
      expect(screen.getByText("Your Misses")).toBeInTheDocument();
      expect(screen.getByText("Your Sent")).toBeInTheDocument();
      expect(screen.getByText("Listening Queue")).toBeInTheDocument();
    });
  });

  it("loads friend recommendations on mount", async () => {
    const mockRecommendations = [
      {
        from_user_id: "friend-1",
        status: "pending",
      },
      {
        from_user_id: "friend-1",
        status: "hit",
      },
    ];

    const mockProfiles = [
      {
        user_id: "friend-1",
        display_name: "Sarah",
      },
    ];

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({ data: mockRecommendations, error: null })
        ),
      })),
    }));

    // @ts-expect-error
    supabase.from = fromMock;

    // First call returns recommendations, second call returns profiles
    fromMock
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({ data: mockRecommendations, error: null })
          ),
        })),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
        })),
      }));

    render(<Music />);

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith("music_recommendations");
    });
  });

  it("displays friend cards when recommendations exist", async () => {
    const mockRecommendations = [
      { from_user_id: "friend-1", status: "pending" },
    ];

    const mockProfiles = [{ user_id: "friend-1", display_name: "Sarah" }];

    const fromMock = vi.fn();

    fromMock
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({ data: mockRecommendations, error: null })
          ),
        })),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
        })),
      }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(<Music />);

    await waitFor(() => {
      expect(screen.getByText("Sarah")).toBeInTheDocument();
    });
  });

  it("shows pending count badge on friend cards", async () => {
    const mockRecommendations = [
      { from_user_id: "friend-1", status: "pending" },
      { from_user_id: "friend-1", status: "pending" },
    ];

    const mockProfiles = [{ user_id: "friend-1", display_name: "Sarah" }];

    const fromMock = vi.fn();

    fromMock
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({ data: mockRecommendations, error: null })
          ),
        })),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
        })),
      }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(<Music />);

    await waitFor(() => {
      expect(screen.getByText("2 new")).toBeInTheDocument();
    });
  });

  it("navigates to friend playlist view when clicking friend card", async () => {
    const user = userEvent.setup();
    const mockRecommendations = [
      { from_user_id: "friend-1", status: "pending" },
    ];

    const mockProfiles = [{ user_id: "friend-1", display_name: "Sarah" }];

    const fromMock = vi.fn();

    fromMock
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({ data: mockRecommendations, error: null })
          ),
        })),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
        })),
      }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(<Music />);

    await waitFor(() => {
      expect(screen.getByText("Sarah")).toBeInTheDocument();
    });

    const friendCard = screen.getByText("Sarah").closest("button");
    if (friendCard) {
      await user.click(friendCard);
    }

    await waitFor(() => {
      expect(screen.getByText(/From Sarah/i)).toBeInTheDocument();
    });
  });

  it("calculates hit and miss counts correctly", async () => {
    const mockRecommendations = [
      { from_user_id: "friend-1", status: "hit" },
      { from_user_id: "friend-1", status: "hit" },
      { from_user_id: "friend-1", status: "miss" },
    ];

    const mockProfiles = [{ user_id: "friend-1", display_name: "Sarah" }];

    const fromMock = vi.fn();

    fromMock
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({ data: mockRecommendations, error: null })
          ),
        })),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
        })),
      }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(<Music />);

    await waitFor(() => {
      // Check quick stats show correct counts
      const hitsSection = screen.getByText("Your Hits").closest("button");
      expect(hitsSection?.textContent).toContain("2");

      const missesSection = screen.getByText("Your Misses").closest("button");
      expect(missesSection?.textContent).toContain("1");
    });
  });
});
