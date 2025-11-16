import { useState, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { getFriends } from "../../../lib/connections";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys";
import SendMediaModalSearchStep from "./SendMediaModalSearchStep";
import SendMediaModalFriendsStep from "./SendMediaModalFriendsStep";
import SendMediaModalDetailsStep from "./SendMediaModalDetailsStep";
import SendMediaModalSuccess from "./SendMediaModalSuccess";

// Generic media item interface
export interface MediaItem {
  external_id: string;
  title: string;
  subtitle?: string; // artist for music, director for movies, developer for games
  authors?: string; // for books (plural to match Google Books API - comma-separated string)
  artist?: string; // for music - primary artist
  album?: string; // for music - album name
  poster_url: string | null;
  release_date?: string | null;
  description?: string | null;
  media_type?: string; // track/album for music, movie/tv for movies, etc.
  page_count?: number; // for books
  isbn?: string; // for books
  categories?: string; // for books - comma-separated categories from Google Books API
  genre?: string | null; // for music - primary genre from iTunes API
  // Game-specific fields (from RAWG API)
  slug?: string; // URL-friendly game identifier
  platforms?: string; // Comma-separated platform names
  genres?: string; // Comma-separated genre names (for games)
  rating?: number; // RAWG rating (0.00-5.00)
  metacritic?: number; // Metacritic score (0-100)
  playtime?: number; // Average playtime in hours
}

// Friend interface
interface Friend {
  user_id: string;
  display_name: string;
}

// Props for the generic modal
interface SendMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;

  // Media-specific configuration
  mediaType: "music" | "movies" | "books" | "games";
  tableName: string; // e.g., "music_recommendations", "movie_recommendations"
  searchPlaceholder: string; // e.g., "Search for songs, albums, or artists..."

  // Search function - returns media items
  searchFunction: (query: string) => Promise<MediaItem[]>;

  // Recommendation type options (e.g., listen/watch for music, watch/rewatch for movies)
  // Optional - if not provided, won't show recommendation type selector
  recommendationTypes?: Array<{ value: string; label: string }>;
  defaultRecommendationType?: string;

  // Optional: Preselected item (skips search step)
  preselectedItem?: MediaItem;
}

export default function SendMediaModal({
  isOpen,
  onClose,
  onSent,
  mediaType,
  tableName,
  searchPlaceholder,
  searchFunction,
  recommendationTypes,
  defaultRecommendationType,
  preselectedItem,
}: SendMediaModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Selection state
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(
    preselectedItem || null
  );
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(
    new Set()
  );
  const [recommendationType, setRecommendationType] = useState(
    defaultRecommendationType
  );
  const [message, setMessage] = useState("");

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsWithExistingRec, setFriendsWithExistingRec] = useState<
    Set<string>
  >(new Set());

  // UI state
  const [step, setStep] = useState<"search" | "friends" | "details">(
    preselectedItem ? "friends" : "search"
  );
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for existing recommendations when item is selected
  const checkExistingRecommendations = useCallback(
    async (item: MediaItem) => {
      if (!user) return;

      try {
        // Query the recommendations table to find which friends already received this item
        const { data, error } = await supabase
          .from(tableName)
          .select("to_user_id")
          .eq("from_user_id", user.id)
          .eq("external_id", item.external_id);

        if (error) {
          console.error("Error checking existing recommendations:", error);
          return;
        }

        // Create set of friend IDs who already received this item
        const existingRecipients = new Set(data.map((rec) => rec.to_user_id));
        setFriendsWithExistingRec(existingRecipients);
      } catch (error) {
        console.error("Error checking existing recommendations:", error);
      }
    },
    [user, tableName]
  );

  // Load friends
  const loadFriends = useCallback(async () => {
    if (!user) return;

    setLoadingFriends(true);
    try {
      // Use the connections service (works with mock or real data)
      const { data: friendsList, error: friendsError } = await getFriends(
        user.id
      );

      if (friendsError) {
        console.error("Error loading friends:", friendsError);
        setFriends([]);
      } else {
        setFriends(friendsList || []);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [user]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const results = await searchFunction(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchFunction]);

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      void loadFriends();
    }
  }, [isOpen, loadFriends]);

  // Update selected item and step when modal opens with preselected item
  useEffect(() => {
    if (isOpen && preselectedItem) {
      setSelectedItem(preselectedItem);
      void checkExistingRecommendations(preselectedItem);
      setStep("friends");
    }
  }, [isOpen, preselectedItem, checkExistingRecommendations]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedItem(null);
      setSelectedFriends(new Set());
      setFriendsWithExistingRec(new Set());
      setRecommendationType(defaultRecommendationType);
      setMessage("");
      setStep("search");
      setSending(false);
      setShowSuccess(false);
    }
  }, [isOpen, defaultRecommendationType]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, sending]);

  const handleClose = () => {
    onClose();
  };

  const handleItemSelect = (item: MediaItem) => {
    setSelectedItem(item);
    void checkExistingRecommendations(item);
    setStep("friends");
  };

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const toggleAllFriends = () => {
    // Filter out friends who already received this recommendation
    const availableFriends = friends.filter(
      (f) => !friendsWithExistingRec.has(f.user_id)
    );
    const availableFriendIds = availableFriends.map((f) => f.user_id);

    if (
      selectedFriends.size === availableFriends.length &&
      availableFriends.length > 0
    ) {
      setSelectedFriends(new Set());
    } else {
      setSelectedFriends(new Set(availableFriendIds));
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    newSelected.delete(friendId);
    setSelectedFriends(newSelected);
  };

  const handleContinue = () => {
    if (selectedFriends.size > 0) {
      setStep("details");
    }
  };

  const handleSend = async () => {
    if (!user || !selectedItem || selectedFriends.size === 0) return;

    setSending(true);
    try {
      // Create recommendations for each selected friend
      const recommendations = Array.from(selectedFriends).map((friendId) => {
        // Books table has different column names - no media_type, uses thumbnail_url not poster_url
        if (mediaType === "books") {
          return {
            from_user_id: user.id,
            to_user_id: friendId,
            external_id: selectedItem.external_id,
            title: selectedItem.title,
            authors: selectedItem.authors || null,
            thumbnail_url: selectedItem.poster_url || null,
            published_date: selectedItem.release_date || null,
            description: selectedItem.description || null,
            isbn: selectedItem.isbn || null,
            page_count: selectedItem.page_count || null,
            status: "pending",
            recommendation_type: recommendationType || "read",
            sent_message: message || null,
          };
        }

        // Games table has different column names - no media_type, uses game-specific fields
        if (mediaType === "games") {
          return {
            from_user_id: user.id,
            to_user_id: friendId,
            external_id: selectedItem.external_id,
            slug: selectedItem.slug || "",
            name: selectedItem.title,
            released: selectedItem.release_date || null,
            background_image: selectedItem.poster_url || null,
            platforms: selectedItem.platforms || null,
            genres: selectedItem.genres || null,
            rating: selectedItem.rating || null,
            metacritic: selectedItem.metacritic || null,
            playtime: selectedItem.playtime || null,
            status: "pending",
            recommendation_type: recommendationType || "play",
            sent_message: message || null,
          };
        }

        const baseRecommendation = {
          from_user_id: user.id,
          to_user_id: friendId,
          external_id: selectedItem.external_id,
          title: selectedItem.title,
          poster_url: selectedItem.poster_url,
          media_type: selectedItem.media_type || "unknown",
          status: "pending",
          recommendation_type: recommendationType,
          sent_message: message || null,
        };

        // Add media-type-specific fields
        if (mediaType === "music") {
          return {
            ...baseRecommendation,
            artist: selectedItem.subtitle || null,
            album: null, // Could be extracted from media_type if needed
            release_date: selectedItem.release_date || null,
            preview_url: null, // Could add preview URL if available from API
          };
        } else if (mediaType === "movies") {
          return {
            ...baseRecommendation,
            release_date: selectedItem.release_date || null,
            overview: selectedItem.description || null,
          };
        }

        return baseRecommendation;
      });

      const { error } = await supabase.from(tableName).insert(recommendations);

      if (error) {
        if (error.message.includes("duplicate key")) {
          alert(
            "You've already sent this recommendation to one or more of these friends."
          );
        } else {
          alert(`Failed to send recommendation: ${error.message}`);
        }
        setSending(false);
        return;
      }

      // Show success message
      setSending(false);
      setShowSuccess(true);

      // Invalidate recommendation queries to refresh lists
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });

      // Wait a moment before closing
      setTimeout(() => {
        setShowSuccess(false);
        onSent();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Error sending recommendations:", error);
      setSending(false);
      alert("Failed to send recommendation. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        selectedItem
          ? `Recommend: ${selectedItem.title}`
          : `Recommend ${
              mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
            }`
      }
      maxWidth="2xl"
    >
      {/* Content */}
      <div className="overflow-y-auto p-6 max-h-[60vh]">
        {/* Search Step */}
        {step === "search" && (
          <SendMediaModalSearchStep
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            searching={searching}
            onItemSelect={handleItemSelect}
            searchPlaceholder={searchPlaceholder}
          />
        )}

        {/* Friends Step */}
        {step === "friends" && (
          <SendMediaModalFriendsStep
            friends={friends}
            selectedFriends={selectedFriends}
            friendsWithExistingRec={friendsWithExistingRec}
            loadingFriends={loadingFriends}
            onToggleFriend={toggleFriend}
            onToggleAll={toggleAllFriends}
          />
        )}

        {/* Details Step */}
        {step === "details" && (
          <SendMediaModalDetailsStep
            selectedFriends={selectedFriends}
            friends={friends}
            recommendationTypes={recommendationTypes}
            recommendationType={recommendationType}
            setRecommendationType={setRecommendationType}
            message={message}
            setMessage={setMessage}
            mediaType={mediaType}
            onRemoveFriend={handleRemoveFriend}
          />
        )}

        {/* Success State */}
        {showSuccess && <SendMediaModalSuccess />}
      </div>

      {/* Footer */}
      {!showSuccess && (
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {step === "friends" && (
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={selectedFriends.size === 0}
            >
              Continue
            </Button>
          )}

          {step === "details" && (
            <Button
              variant="primary"
              onClick={() => void handleSend()}
              disabled={sending}
              loading={sending}
              icon={<Send className="w-4 h-4" />}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
