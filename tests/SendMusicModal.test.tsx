import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SendMusicModal from "../src/components/media/SendMusicModal";

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
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        neq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock fetch for iTunes API
global.fetch = vi.fn();

describe("SendMusicModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
  });

  it("does not render when isOpen is false", () => {
    render(
      <SendMusicModal
        isOpen={false}
        onClose={mockOnClose}
        onSent={mockOnSent}
      />
    );
    expect(screen.queryByText("Search for Music")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );
    expect(screen.getByText("Search for Music")).toBeInTheDocument();
  });

  it("shows search input with placeholder", () => {
    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );
    expect(
      screen.getByPlaceholderText(/start typing to search/i)
    ).toBeInTheDocument();
  });

  it("shows empty state before searching", () => {
    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );
    expect(
      screen.getByText(/start typing to search for music/i)
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    // Find the X button in the header (first one)
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons[0]; // First button is the X button in header
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("searches iTunes API when user types", async () => {
    const user = userEvent.setup();

    const mockResponse = {
      results: [
        {
          trackId: 123,
          trackName: "Test Song",
          artistName: "Test Artist",
          collectionName: "Test Album",
          releaseDate: "2024-01-01",
          artworkUrl100: "https://example.com/art.jpg",
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    const searchInput = screen.getByPlaceholderText(/start typing to search/i);
    await user.type(searchInput, "test song");

    // Wait for debounce (500ms)
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("itunes.apple.com/search")
        );
      },
      { timeout: 1000 }
    );
  });

  it("displays search results", async () => {
    const user = userEvent.setup();

    const mockResponse = {
      results: [
        {
          trackId: 123,
          trackName: "Test Song",
          artistName: "Test Artist",
          collectionName: "Test Album",
          releaseDate: "2024-01-01",
          artworkUrl100: "https://example.com/art.jpg",
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    const searchInput = screen.getByPlaceholderText(/start typing to search/i);
    await user.type(searchInput, "test song");

    await waitFor(
      () => {
        expect(screen.getByText("Test Song")).toBeInTheDocument();
        expect(
          screen.getByText(/Test Artist • Test Album/i)
        ).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("shows Searching... indicator while searching", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ json: async () => ({ results: [] }) }),
            100
          )
        )
    );

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    const searchInput = screen.getByPlaceholderText(/start typing to search/i);
    await user.type(searchInput, "test");

    await waitFor(
      () => {
        expect(screen.getByText("Searching...")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("proceeds to friend selection after selecting a song", async () => {
    const user = userEvent.setup();

    const mockResponse = {
      results: [
        {
          trackId: 123,
          trackName: "Test Song",
          artistName: "Test Artist",
          collectionName: "Test Album",
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    const searchInput = screen.getByPlaceholderText(/start typing to search/i);
    await user.type(searchInput, "test");

    await waitFor(
      () => {
        expect(screen.getByText("Test Song")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const songButton = screen.getByText("Test Song").closest("button");
    if (songButton) {
      await user.click(songButton);
    }

    await waitFor(() => {
      expect(screen.getByText("Send to Friends")).toBeInTheDocument();
    });
  });

  it("loads friends list on mount", async () => {
    const mockFriends = [
      { user_id: "friend-1", display_name: "Sarah" },
      { user_id: "friend-2", display_name: "John" },
    ];

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockFriends, error: null })
          ),
        })),
      })),
    }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith("user_profiles");
    });
  });

  it("loads recent friends from recommendations", async () => {
    const mockFriends = [{ user_id: "friend-1", display_name: "Sarah" }];

    const mockRecentRecs = [{ to_user_id: "friend-1" }];

    const fromMock = vi.fn();

    // First call: load friends
    fromMock.mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockFriends, error: null })
          ),
        })),
      })),
    }));

    // Second call: load recent recommendations
    fromMock.mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({ data: mockRecentRecs, error: null })
            ),
          })),
        })),
      })),
    }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith("music_recommendations");
    });
  });

  it("shows Select All button when multiple friends exist", async () => {
    const mockFriends = [
      { user_id: "friend-1", display_name: "Sarah" },
      { user_id: "friend-2", display_name: "John" },
    ];

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockFriends, error: null })
          ),
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));

    // @ts-expect-error
    supabase.from = fromMock;

    // Navigate to friend selection
    const mockResponse = {
      results: [
        {
          trackId: 123,
          trackName: "Test Song",
          artistName: "Test Artist",
          collectionName: "Test Album",
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/start typing to search/i);
    await user.type(searchInput, "test");

    await waitFor(
      () => {
        expect(screen.getByText("Test Song")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const songButton = screen.getByText("Test Song").closest("button");
    if (songButton) {
      await user.click(songButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/select all \(2\)/i)).toBeInTheDocument();
    });
  });

  it("shows Listen and Watch options", async () => {
    const user = userEvent.setup();

    // Setup: Get to friend selection, then to message step
    const mockResponse = {
      results: [
        {
          trackId: 123,
          trackName: "Test Song",
          artistName: "Test Artist",
          collectionName: "Test Album",
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    const mockFriends = [{ user_id: "friend-1", display_name: "Sarah" }];

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockFriends, error: null })
          ),
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    // Search and select song
    const searchInput = screen.getByPlaceholderText(/start typing to search/i);
    await user.type(searchInput, "test");

    await waitFor(
      () => {
        expect(screen.getByText("Test Song")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const songButton = screen.getByText("Test Song").closest("button");
    if (songButton) await user.click(songButton);

    // Select friend
    await waitFor(() => {
      expect(screen.getByText("Sarah")).toBeInTheDocument();
    });

    const friendButton = screen.getByText("Sarah").closest("button");
    if (friendButton) await user.click(friendButton);

    // Continue to message step
    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    // Check for Listen/Watch buttons
    await waitFor(() => {
      expect(screen.getByText("Listen")).toBeInTheDocument();
      expect(screen.getByText("Watch")).toBeInTheDocument();
    });
  });

  it("sends recommendation with correct data", async () => {
    const user = userEvent.setup();

    const mockResponse = {
      results: [
        {
          trackId: 123,
          trackName: "Test Song",
          artistName: "Test Artist",
          collectionName: "Test Album",
          releaseDate: "2024-01-01",
          artworkUrl100: "https://example.com/art.jpg",
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    const mockFriends = [{ user_id: "friend-1", display_name: "Sarah" }];

    const insertMock = vi.fn(() => Promise.resolve({ error: null }));
    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockFriends, error: null })
          ),
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: insertMock,
    }));

    // @ts-expect-error
    supabase.from = fromMock;

    render(
      <SendMusicModal isOpen={true} onClose={mockOnClose} onSent={mockOnSent} />
    );

    // Complete flow
    const searchInput = screen.getByPlaceholderText(/start typing to search/i);
    await user.type(searchInput, "test");

    await waitFor(
      () => {
        expect(screen.getByText("Test Song")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const songButton = screen.getByText("Test Song").closest("button");
    if (songButton) await user.click(songButton);

    await waitFor(() => {
      expect(screen.getByText("Sarah")).toBeInTheDocument();
    });

    const friendButton = screen.getByText("Sarah").closest("button");
    if (friendButton) await user.click(friendButton);

    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText("Send")).toBeInTheDocument();
    });

    const sendButton = screen.getByText("Send");
    await user.click(sendButton);

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            from_user_id: "test-user-id",
            to_user_id: "friend-1",
            external_id: "123",
            title: "Test Song",
            artist: "Test Artist",
            album: "Test Album",
            year: 2023,
            poster_url: "https://example.com/art.jpg",
            media_type: "track",
            status: "pending",
            recommendation_type: "listen",
            sent_message: null,
          }),
        ])
      );
    });

    expect(mockOnSent).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
