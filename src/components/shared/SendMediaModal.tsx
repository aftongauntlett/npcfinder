import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Send,
  Check,
  Eye,
  RotateCcw,
  Headphones,
  Video,
  BookOpen,
  Gamepad2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { getFriends } from "../../lib/connections";
import Modal from "./Modal";
import Button from "./Button";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

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
      title={`Recommend ${
        mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
      }`}
      maxWidth="2xl"
    >
      {/* Content */}
      <div className="overflow-y-auto p-6 max-h-[60vh]">
        {/* Search Step */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>

            {searching && (
              <p className="text-center text-gray-500">Searching...</p>
            )}

            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="text-center text-gray-500">No results found</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((item) => (
                  <button
                    key={item.external_id}
                    onClick={() => handleItemSelect(item)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    {item.poster_url && (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connections Step */}
        {step === "friends" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Select Connections
              </h3>
              {friends.length > 1 && (
                <button
                  onClick={toggleAllFriends}
                  className="text-sm font-medium"
                  style={{ color: "var(--color-primary)" }}
                >
                  {selectedFriends.size === friends.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {loadingFriends && (
              <p className="text-center text-gray-500">
                Loading connections...
              </p>
            )}

            {!loadingFriends && friends.length === 0 && (
              <p className="text-center text-gray-500">
                No connections available.
              </p>
            )}

            {friends.length > 0 && (
              <div className="space-y-2">
                {friends.map((friend) => {
                  const alreadyRecommended = friendsWithExistingRec.has(
                    friend.user_id
                  );
                  const isSelected = selectedFriends.has(friend.user_id);

                  return (
                    <button
                      key={friend.user_id}
                      onClick={() =>
                        !alreadyRecommended && toggleFriend(friend.user_id)
                      }
                      disabled={alreadyRecommended}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        alreadyRecommended
                          ? "opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
                          : isSelected
                          ? "bg-gray-100/50 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/50"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          alreadyRecommended
                            ? "border-gray-300 dark:border-gray-600"
                            : isSelected
                            ? "border-transparent"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        style={
                          isSelected && !alreadyRecommended
                            ? { backgroundColor: "var(--color-primary)" }
                            : undefined
                        }
                      >
                        {isSelected && !alreadyRecommended && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span
                        className={
                          alreadyRecommended
                            ? "text-gray-400 dark:text-gray-600"
                            : isSelected
                            ? "text-white"
                            : "text-gray-900 dark:text-white"
                        }
                      >
                        {friend.display_name}
                      </span>
                      {alreadyRecommended && (
                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                          Already recommended
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Details Step */}
        {step === "details" && (
          <div className="space-y-4">
            {/* Only show recommendation type selector if there are types */}
            {recommendationTypes && recommendationTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 dark:text-gray-400 mb-6 uppercase tracking-wider">
                  Recommendation Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {recommendationTypes.map((type) => {
                    const isSelected = recommendationType === type.value;

                    // Choose icon and glow color based on media type and recommendation type
                    let Icon = Eye;
                    let glowColor = "rgba(59, 130, 246, 0.4)"; // blue
                    let ringColor = "rgb(59, 130, 246)";

                    // Music icons
                    if (mediaType === "music") {
                      if (type.value === "listen") {
                        Icon = Headphones;
                        glowColor = "rgba(59, 130, 246, 0.4)"; // blue
                        ringColor = "rgb(59, 130, 246)";
                      } else if (type.value === "watch") {
                        Icon = Video;
                        glowColor = "rgba(99, 102, 241, 0.4)"; // indigo
                        ringColor = "rgb(99, 102, 241)";
                      }
                    }
                    // Movie/TV icons
                    else if (mediaType === "movies") {
                      if (type.value === "watch") {
                        Icon = Eye;
                        glowColor = "rgba(59, 130, 246, 0.4)"; // blue
                        ringColor = "rgb(59, 130, 246)";
                      } else if (type.value === "rewatch") {
                        Icon = RotateCcw;
                        glowColor = "rgba(99, 102, 241, 0.4)"; // indigo
                        ringColor = "rgb(99, 102, 241)";
                      }
                    }
                    // Book icons
                    else if (mediaType === "books") {
                      if (type.value === "read") {
                        Icon = BookOpen;
                        glowColor = "rgba(59, 130, 246, 0.4)"; // blue
                        ringColor = "rgb(59, 130, 246)";
                      } else if (type.value === "listen") {
                        Icon = Headphones;
                        glowColor = "rgba(99, 102, 241, 0.4)"; // indigo
                        ringColor = "rgb(99, 102, 241)";
                      }
                    }
                    // Game icons
                    else if (mediaType === "games") {
                      if (type.value === "play") {
                        Icon = Gamepad2;
                        glowColor = "rgba(59, 130, 246, 0.4)"; // blue
                        ringColor = "rgb(59, 130, 246)";
                      } else if (type.value === "replay") {
                        Icon = RotateCcw;
                        glowColor = "rgba(99, 102, 241, 0.4)"; // indigo
                        ringColor = "rgb(99, 102, 241)";
                      }
                    }
                    return (
                      <button
                        key={type.value}
                        onClick={() => setRecommendationType(type.value)}
                        className={`group relative flex flex-col items-center justify-center gap-4 py-8 px-6 rounded-2xl transition-all duration-300 ${
                          isSelected
                            ? "bg-gray-800/60 dark:bg-gray-800/60 scale-[1.02]"
                            : "bg-gray-900/40 dark:bg-gray-900/40 hover:bg-gray-800/40 dark:hover:bg-gray-800/40"
                        }`}
                        style={{
                          border: isSelected
                            ? `1px solid ${ringColor}`
                            : "1px solid rgba(55, 65, 81, 0.3)",
                          boxShadow: isSelected
                            ? `0 0 40px ${glowColor}, 0 0 20px ${glowColor}, inset 0 0 20px ${glowColor}`
                            : "none",
                        }}
                      >
                        {/* Icon with glow effect */}
                        <div
                          className={`relative transition-all duration-300 ${
                            isSelected ? "scale-110" : ""
                          }`}
                          style={{
                            filter: isSelected
                              ? `drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 10px ${glowColor})`
                              : "none",
                          }}
                        >
                          <Icon
                            className={`w-12 h-12 transition-colors duration-300 ${
                              isSelected
                                ? "text-white"
                                : "text-gray-500 group-hover:text-gray-400"
                            }`}
                            strokeWidth={1.5}
                            style={{
                              color: isSelected ? ringColor : undefined,
                            }}
                          />
                        </div>

                        {/* Label */}
                        <span
                          className={`text-sm font-medium tracking-wide transition-all duration-300 ${
                            isSelected
                              ? "text-white"
                              : "text-gray-400 group-hover:text-gray-300"
                          }`}
                        >
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-6">
              <label className="block text-sm font-medium text-gray-400 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note about why you're recommending this..."
                className="w-full px-4 py-4 border border-gray-700/50 dark:border-gray-700/50 rounded-xl bg-gray-900/40 dark:bg-gray-900/40 text-gray-300 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:border-gray-600 dark:focus:border-gray-600 focus:bg-gray-800/50 dark:focus:bg-gray-800/50 transition-all"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Success State */}
        {showSuccess && (
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--color-primary-pale)" }}
            >
              <Check
                className="w-8 h-8"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Sent!
            </p>
          </div>
        )}
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
