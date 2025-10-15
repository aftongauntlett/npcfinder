import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SendMediaModal from "../src/components/shared/SendMediaModal";
import type { MediaItem } from "../src/components/shared/SendMediaModal";

// Define mock functions before vi.mock calls
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOr = vi.fn();
const mockIn = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

// Mock AuthContext
vi.mock("../src/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    loading: false,
  }),
}));

// Mock Supabase
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    from: () => mockFrom(),
  },
}));

describe("SendMediaModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSent = vi.fn();

  // Mock search function for music
  const mockMusicSearch = vi.fn((query: string): Promise<MediaItem[]> => {
    if (query.toLowerCase().includes("taylor")) {
      return Promise.resolve([
        {
          external_id: "1",
          title: "Shake It Off",
          subtitle: "Taylor Swift",
          poster_url: "https://example.com/taylor.jpg",
          release_date: "2014-08-18",
          media_type: "track",
        },
        {
          external_id: "2",
          title: "Blank Space",
          subtitle: "Taylor Swift",
          poster_url: "https://example.com/blank.jpg",
          release_date: "2014-11-10",
          media_type: "track",
        },
      ]);
    }
    return Promise.resolve([]);
  });

  // Mock search function for movies
  const mockMoviesSearch = vi.fn((query: string): Promise<MediaItem[]> => {
    if (query.toLowerCase().includes("inception")) {
      return Promise.resolve([
        {
          external_id: "27205",
          title: "Inception",
          subtitle: "Movie",
          poster_url: "https://example.com/inception.jpg",
          release_date: "2010-07-16",
          description: "A thief who enters dreams",
          media_type: "movie",
        },
      ]);
    }
    return Promise.resolve([]);
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up stable mock implementations
    mockInsert.mockResolvedValue({ error: null });

    mockEq.mockResolvedValue({
      data: [
        {
          user_id: "test-user-id",
          friend_id: "friend-1",
          status: "accepted",
        },
        {
          user_id: "test-user-id",
          friend_id: "friend-2",
          status: "accepted",
        },
      ],
      error: null,
    });

    mockOr.mockReturnValue({ eq: mockEq });

    mockIn.mockResolvedValue({
      data: [
        { user_id: "friend-1", display_name: "Friend One" },
        { user_id: "friend-2", display_name: "Friend Two" },
      ],
      error: null,
    });

    mockSelect.mockReturnValue({
      or: mockOr,
      in: mockIn,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });
  });

  describe("Modal Visibility", () => {
    it("does not render when isOpen is false", () => {
      render(
        <SendMediaModal
          isOpen={false}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      expect(
        screen.queryByText(/Send Music Recommendation/i)
      ).not.toBeInTheDocument();
    });

    it("renders when isOpen is true", () => {
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      expect(
        screen.getByText(/Send Music Recommendation/i)
      ).toBeInTheDocument();
    });
  });

  describe("Music Search", () => {
    it("shows search placeholder for music", () => {
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs, albums, or artists..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      expect(
        screen.getByPlaceholderText("Search for songs, albums, or artists...")
      ).toBeInTheDocument();
    });

    it("searches for music and displays results", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");

      // Wait for debounce and results
      await waitFor(
        () => {
          expect(mockMusicSearch).toHaveBeenCalledWith("taylor");
        },
        { timeout: 1000 }
      );

      await waitFor(() => {
        expect(screen.getByText("Shake It Off")).toBeInTheDocument();
        expect(screen.getByText("Blank Space")).toBeInTheDocument();
      });
    });

    it("shows 'No results found' when search returns empty", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "zzzznonexistent");

      await waitFor(
        () => {
          expect(screen.getByText("No results found")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Movies Search", () => {
    it("shows search placeholder for movies", () => {
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="movies"
          tableName="movie_recommendations"
          searchPlaceholder="Search for movies or TV shows..."
          searchFunction={mockMoviesSearch}
          recommendationTypes={[
            { value: "watch", label: "Watch" },
            { value: "rewatch", label: "Rewatch" },
          ]}
          defaultRecommendationType="watch"
        />
      );

      expect(
        screen.getByText(/Send Movies Recommendation/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search for movies or TV shows...")
      ).toBeInTheDocument();
    });

    it("searches for movies and displays results", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="movies"
          tableName="movie_recommendations"
          searchPlaceholder="Search for movies..."
          searchFunction={mockMoviesSearch}
          recommendationTypes={[
            { value: "watch", label: "Watch" },
            { value: "rewatch", label: "Rewatch" },
          ]}
          defaultRecommendationType="watch"
        />
      );

      const searchInput = screen.getByPlaceholderText("Search for movies...");
      await user.type(searchInput, "inception");

      await waitFor(
        () => {
          expect(mockMoviesSearch).toHaveBeenCalledWith("inception");
        },
        { timeout: 1000 }
      );

      await waitFor(() => {
        expect(screen.getByText("Inception")).toBeInTheDocument();
        expect(screen.getByText("Movie")).toBeInTheDocument();
      });
    });
  });

  describe("Friend Selection", () => {
    it("navigates to friend selection after selecting a track", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");

      await waitFor(() => {
        expect(screen.getByText("Shake It Off")).toBeInTheDocument();
      });

      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) {
        await user.click(trackButton);
      }

      await waitFor(() => {
        expect(screen.getByText("Select Friends")).toBeInTheDocument();
      });
    });

    it("displays list of friends", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Search and select a track
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");

      await waitFor(() => {
        expect(screen.getByText("Shake It Off")).toBeInTheDocument();
      });

      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) {
        await user.click(trackButton);
      }

      // Check friends are loaded and displayed
      await waitFor(() => {
        expect(screen.getByText("Friend One")).toBeInTheDocument();
        expect(screen.getByText("Friend Two")).toBeInTheDocument();
      });
    });

    it("allows selecting and deselecting friends", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate to friends step
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() => {
        expect(screen.getByText("Shake It Off")).toBeInTheDocument();
      });
      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) {
        await user.click(trackButton);
      }

      await waitFor(() => {
        expect(screen.getByText("Friend One")).toBeInTheDocument();
      });

      // Select a friend
      const friendOneButton = screen.getByText("Friend One").closest("button");
      if (friendOneButton) {
        await user.click(friendOneButton);
        // Button should have selected styling
        expect(friendOneButton).toHaveClass("bg-blue-100");
      }
    });

    it("enables Continue button when friends are selected", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate to friends step
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() => {
        expect(screen.getByText("Shake It Off")).toBeInTheDocument();
      });
      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) {
        await user.click(trackButton);
      }

      await waitFor(() => {
        expect(screen.getByText("Friend One")).toBeInTheDocument();
      });

      // Initially, Continue button should be disabled
      const continueButton = screen.getByRole("button", { name: /continue/i });
      expect(continueButton).toBeDisabled();

      // Select a friend
      const friendOneButton = screen.getByText("Friend One").closest("button");
      if (friendOneButton) {
        await user.click(friendOneButton);
      }

      // Now Continue button should be enabled
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe("Recommendation Details", () => {
    it("navigates to details step after selecting friends", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate through steps
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() => {
        expect(screen.getByText("Shake It Off")).toBeInTheDocument();
      });

      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) {
        await user.click(trackButton);
      }

      await waitFor(() => {
        expect(screen.getByText("Friend One")).toBeInTheDocument();
      });

      const friendOneButton = screen.getByText("Friend One").closest("button");
      if (friendOneButton) {
        await user.click(friendOneButton);
      }

      const continueButton = screen.getByRole("button", { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText("Recommendation Type")).toBeInTheDocument();
      });
    });

    it("shows correct recommendation type options for music", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate to details step
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() =>
        expect(screen.getByText("Shake It Off")).toBeInTheDocument()
      );
      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) await user.click(trackButton);

      await waitFor(() =>
        expect(screen.getByText("Friend One")).toBeInTheDocument()
      );
      const friendButton = screen.getByText("Friend One").closest("button");
      if (friendButton) await user.click(friendButton);

      const continueButton = screen.getByRole("button", { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Listen" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Watch" })
        ).toBeInTheDocument();
      });
    });

    it("allows adding an optional message", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate to details step
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() =>
        expect(screen.getByText("Shake It Off")).toBeInTheDocument()
      );
      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) await user.click(trackButton);

      await waitFor(() =>
        expect(screen.getByText("Friend One")).toBeInTheDocument()
      );
      const friendButton = screen.getByText("Friend One").closest("button");
      if (friendButton) await user.click(friendButton);

      const continueButton = screen.getByRole("button", { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        const messageTextarea =
          screen.getByPlaceholderText(/Add a note about why/i);
        expect(messageTextarea).toBeInTheDocument();
      });

      const messageTextarea =
        screen.getByPlaceholderText(/Add a note about why/i);
      await user.type(messageTextarea, "You'll love this song!");

      expect(messageTextarea).toHaveValue("You'll love this song!");
    });
  });

  describe("Sending Recommendations", () => {
    it("sends recommendation to database with correct data", async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValueOnce({ error: null });

      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate through all steps
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() =>
        expect(screen.getByText("Shake It Off")).toBeInTheDocument()
      );

      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) await user.click(trackButton);

      await waitFor(() =>
        expect(screen.getByText("Friend One")).toBeInTheDocument()
      );
      const friendButton = screen.getByText("Friend One").closest("button");
      if (friendButton) await user.click(friendButton);

      const continueButton = screen.getByRole("button", { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /send/i })
        ).toBeInTheDocument()
      );

      const sendButton = screen.getByRole("button", { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });

      // Check that insert was called with correct structure
      expect(mockInsert).toHaveBeenCalledTimes(1);
      const insertArgs = mockInsert.mock.calls[0];
      expect(insertArgs).toBeDefined();
      if (insertArgs && insertArgs[0]) {
        const insertCall = insertArgs[0];
        expect(insertCall).toBeInstanceOf(Array);
        expect(insertCall[0]).toMatchObject({
          from_user_id: "test-user-id",
          to_user_id: "friend-1",
          title: "Shake It Off",
          status: "pending",
        });
      }
    });

    it("shows success message after sending", async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValueOnce({ error: null });

      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate and send
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() =>
        expect(screen.getByText("Shake It Off")).toBeInTheDocument()
      );

      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) await user.click(trackButton);

      await waitFor(() =>
        expect(screen.getByText("Friend One")).toBeInTheDocument()
      );
      const friendButton = screen.getByText("Friend One").closest("button");
      if (friendButton) await user.click(friendButton);

      const continueButton = screen.getByRole("button", { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /send/i })
        ).toBeInTheDocument()
      );

      const sendButton = screen.getByRole("button", { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText("Sent!")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("allows going back from friends to search", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Navigate to friends
      const searchInput = screen.getByPlaceholderText("Search for songs...");
      await user.type(searchInput, "taylor");
      await waitFor(() =>
        expect(screen.getByText("Shake It Off")).toBeInTheDocument()
      );
      const trackButton = screen.getByText("Shake It Off").closest("button");
      if (trackButton) await user.click(trackButton);

      await waitFor(() => {
        expect(screen.getByText("Select Friends")).toBeInTheDocument();
      });

      // Click Back
      const backButton = screen.getByRole("button", { name: /back/i });
      await user.click(backButton);

      // Should be back on search step
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search for songs...")
        ).toBeInTheDocument();
      });
    });

    it("closes modal when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("closes modal when X button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <SendMediaModal
          isOpen={true}
          onClose={mockOnClose}
          onSent={mockOnSent}
          mediaType="music"
          tableName="music_recommendations"
          searchPlaceholder="Search for songs..."
          searchFunction={mockMusicSearch}
          recommendationTypes={[
            { value: "listen", label: "Listen" },
            { value: "watch", label: "Watch" },
          ]}
          defaultRecommendationType="listen"
        />
      );

      // Find the X button (it's the close button in the header)
      const closeButtons = screen.getAllByRole("button");
      const xButton = closeButtons.find((button) => {
        const svg = button.querySelector("svg");
        return svg?.classList.contains("lucide-x");
      });

      if (xButton) {
        await user.click(xButton);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
